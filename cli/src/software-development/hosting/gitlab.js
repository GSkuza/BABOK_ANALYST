/**
 * GitLab read connector for the software-development profile.
 *
 * Talks to the GitLab REST API v4 directly (no CLI wraps GitLab the way `gh`
 * wraps GitHub in this environment), using Node's built-in `fetch`. Base URL
 * is configurable (`baseUrl`) so a self-hosted GitLab instance can be used —
 * this connector does not promise compatibility with every self-managed
 * GitLab version, only with the documented v4 REST shapes used below.
 *
 * IMPORTANT — verification status: this environment has an authenticated
 * `gh` (GitHub) but no GitLab credentials, so unlike hosting/github.js this
 * connector's live-API behaviour has NOT been exercised against a real
 * GitLab instance in this session. Its unit tests mock `fetch` against the
 * documented GitLab REST v4 response shapes; treat it as reviewed-but-unverified
 * until it has been run once against a real project with a real token.
 *
 * Read-only by design — see hosting/github.js's header comment for why
 * write/publish actions are deliberately out of scope here.
 *
 * This file is byte-identical in cli/src/software-development/hosting/gitlab.js
 * and babok-mcp/src/lib/software-development/hosting/gitlab.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

const DEFAULT_BASE_URL = 'https://gitlab.com/api/v4';

export class GitlabApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number|null, code?: string, raw?: string }} [details]
   */
  constructor(message, details = {}) {
    super(message);
    this.name = 'GitlabApiError';
    this.status = details.status ?? null;
    this.code = details.code
      ?? (this.status === 404 ? 'not_found'
        : this.status === 403 ? 'forbidden'
          : this.status === 401 ? 'unauthorized'
            : this.status && this.status >= 500 ? 'upstream_error'
              : 'unknown');
    this.raw = details.raw;
  }
}

/** GitLab project identifiers are either a numeric id or a URL-encoded "owner/repo" path. */
function encodeProjectId(owner, repo) {
  return encodeURIComponent(`${owner}/${repo}`);
}

function encodeRef(ref) {
  return encodeURIComponent(ref);
}

function encodeFilePath(filePath) {
  return encodeURIComponent(filePath);
}

/**
 * @param {{ fetchImpl?: Function, baseUrl?: string, token?: string }} [deps]
 */
export function createGitlabConnector(deps = {}) {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const baseUrl = deps.baseUrl ?? DEFAULT_BASE_URL;
  const token = deps.token ?? process.env.GITLAB_TOKEN ?? process.env.GL_TOKEN ?? null;

  if (typeof fetchImpl !== 'function') {
    throw new Error('createGitlabConnector: no fetch implementation available (Node 18+ provides a global fetch; pass fetchImpl otherwise)');
  }

  /**
   * @param {string} pathAndQuery - e.g. "/projects/x/repository/tree?ref=main"
   */
  async function request(pathAndQuery) {
    const url = `${baseUrl}${pathAndQuery}`;
    const headers = token ? { 'PRIVATE-TOKEN': token } : {};
    let response;
    try {
      response = await fetchImpl(url, { headers });
    } catch (err) {
      throw new GitlabApiError(`GitLab API request failed: ${err.message}`, { code: 'network_error', raw: err.message });
    }
    const text = await response.text();
    let body = null;
    try { body = text.trim() === '' ? null : JSON.parse(text); } catch { /* non-JSON body */ }
    if (!response.ok) {
      const message = body?.message ? (Array.isArray(body.message) ? body.message.join('; ') : String(body.message)) : `GitLab API returned HTTP ${response.status}`;
      throw new GitlabApiError(message, { status: response.status, raw: text });
    }
    return { body, headers: response.headers };
  }

  return {
    host: 'gitlab',

    /**
     * @param {{ owner: string, repo: string }} p
     * @returns {Promise<{ fullName: string, defaultBranch: string, private: boolean, htmlUrl: string, description: string|null }>}
     */
    async getRepository({ owner, repo }) {
      const { body } = await request(`/projects/${encodeProjectId(owner, repo)}`);
      return {
        fullName: body.path_with_namespace,
        defaultBranch: body.default_branch,
        private: body.visibility !== 'public',
        htmlUrl: body.web_url,
        description: body.description ?? null,
      };
    },

    /**
     * @param {{ owner: string, repo: string, ref: string }} p
     * @returns {Promise<{ sha: string, message: string, author: string|null, date: string|null }>}
     */
    async resolveCommit({ owner, repo, ref }) {
      const { body } = await request(`/projects/${encodeProjectId(owner, repo)}/repository/commits/${encodeRef(ref)}`);
      return {
        sha: body.id,
        message: body.message ?? '',
        author: body.author_name ?? null,
        date: body.authored_date ?? null,
      };
    },

    /**
     * Follows GitLab's `x-next-page` response header to assemble the full tree
     * (GitLab paginates instead of returning a single `truncated` flag like GitHub).
     * @param {{ owner: string, repo: string, sha: string, recursive?: boolean, maxPages?: number }} p
     * @returns {Promise<{ truncated: boolean, entries: Array<{ path: string, type: string, sha: string }> }>}
     */
    async getTree({ owner, repo, sha, recursive = true, maxPages = 20 }) {
      const projectId = encodeProjectId(owner, repo);
      const entries = [];
      let page = 1;
      let truncated = false;
      for (; page <= maxPages; page += 1) {
        const { body, headers } = await request(
          `/projects/${projectId}/repository/tree?ref=${encodeRef(sha)}&recursive=${recursive}&per_page=100&page=${page}`,
        );
        for (const e of body ?? []) {
          entries.push({ path: e.path, type: e.type === 'tree' ? 'tree' : 'blob', sha: e.id });
        }
        const nextPage = headers.get?.('x-next-page');
        if (!nextPage) break;
        if (page === maxPages) truncated = true;
      }
      return { truncated, entries };
    },

    /**
     * @param {{ owner: string, repo: string, path: string, ref: string, maxBytes?: number }} p
     * @returns {Promise<{ path: string, sha: string, size: number, content: string, truncatedForBudget: boolean }>}
     */
    async getFileContent({ owner, repo, path, ref, maxBytes = 512_000 }) {
      const { body } = await request(
        `/projects/${encodeProjectId(owner, repo)}/repository/files/${encodeFilePath(path)}?ref=${encodeRef(ref)}`,
      );
      if (body.encoding !== 'base64') {
        throw new GitlabApiError(`Unsupported content encoding "${body.encoding}" for "${path}"`, { code: 'unsupported_encoding' });
      }
      const full = Buffer.from(body.content, 'base64');
      const truncatedForBudget = full.length > maxBytes;
      const content = (truncatedForBudget ? full.subarray(0, maxBytes) : full).toString('utf-8');
      return { path: body.file_path, sha: body.blob_id, size: body.size, content, truncatedForBudget };
    },

    /**
     * GitLab merge requests, normalised to the same shape as GitHub pull requests.
     * @param {{ owner: string, repo: string, state?: 'opened'|'closed'|'merged'|'all', perPage?: number }} p
     * @returns {Promise<Array<{ number: number, title: string, state: string, htmlUrl: string, headRef?: string, baseRef?: string }>>}
     */
    async listPullRequests({ owner, repo, state = 'opened', perPage = 30 }) {
      const stateParam = state === 'all' ? '' : `&state=${state}`;
      const { body } = await request(`/projects/${encodeProjectId(owner, repo)}/merge_requests?per_page=${perPage}${stateParam}`);
      return (body ?? []).map(mr => ({
        number: mr.iid,
        title: mr.title,
        state: mr.state,
        htmlUrl: mr.web_url,
        headRef: mr.source_branch,
        baseRef: mr.target_branch,
      }));
    },

    /**
     * @param {{ owner: string, repo: string, state?: 'opened'|'closed'|'all', perPage?: number }} p
     * @returns {Promise<Array<{ number: number, title: string, state: string, htmlUrl: string }>>}
     */
    async listIssues({ owner, repo, state = 'opened', perPage = 30 }) {
      const stateParam = state === 'all' ? '' : `&state=${state}`;
      const { body } = await request(`/projects/${encodeProjectId(owner, repo)}/issues?per_page=${perPage}${stateParam}`);
      return (body ?? []).map(i => ({ number: i.iid, title: i.title, state: i.state, htmlUrl: i.web_url }));
    },

    /**
     * GitLab pipelines — the CI/CD analogue of GitHub Actions runs, but not the same
     * concept (a GitLab pipeline can contain many jobs across many stages); do not
     * treat one pipeline result as equivalent to one GitHub check.
     * @param {{ owner: string, repo: string, perPage?: number }} p
     * @returns {Promise<Array<{ id: number, status: string, ref: string, sha: string, htmlUrl: string }>>}
     */
    async listPipelines({ owner, repo, perPage = 10 }) {
      const { body } = await request(`/projects/${encodeProjectId(owner, repo)}/pipelines?per_page=${perPage}`);
      return (body ?? []).map(p => ({ id: p.id, status: p.status, ref: p.ref, sha: p.sha, htmlUrl: p.web_url }));
    },
  };
}
