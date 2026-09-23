/**
 * GitHub read connector for the software-development profile.
 *
 * Shells out to the `gh` CLI (`gh api ...`) rather than re-implementing HTTP/auth,
 * pagination and rate-limit handling: this environment's `gh` is already
 * authenticated (`gh auth status`), so every method here is a real, testable
 * integration rather than a mock of GitHub's API shape.
 *
 * Read-only by design: Stage 1 (Product & Repository Baseline) and the
 * repository-evidence part of Stage 2/3/5 only ever need to read. Creating
 * branches/PRs is a distinct, separately-authorised capability (Stage 4's
 * Execution Authorisation Status) and is deliberately not implemented here —
 * see docs/AGENT_MESSAGING_AND_PROVIDER_ROUTING_PLAN.md and the
 * software-development profile plan for why execution/publication requires an
 * explicit, separate human decision.
 *
 * Every method throws GithubApiError (status, code, raw) on failure instead of
 * returning a partial/empty result, so callers can distinguish "not found",
 * "no permission" and "transient/network" — never silently treat any of these
 * as "nothing to report".
 *
 * This file is byte-identical in cli/src/software-development/hosting/github.js
 * and babok-mcp/src/lib/software-development/hosting/github.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import { execFile } from 'child_process';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_BUFFER_BYTES = 20 * 1024 * 1024;

export class GithubApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number|null, code?: string, raw?: string }} [details]
   */
  constructor(message, details = {}) {
    super(message);
    this.name = 'GithubApiError';
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

/** Extract an "HTTP nnn" status code gh prints to stderr on failure, if present. */
function extractStatusFromStderr(stderr) {
  const m = /HTTP\s+(\d{3})/i.exec(stderr || '');
  return m ? Number(m[1]) : null;
}

/**
 * Run `gh api <path>` and return the parsed JSON body.
 * @param {string[]} args - args after "api", e.g. ['repos/owner/repo']
 * @param {{ execFileImpl?: Function, timeoutMs?: number }} [options]
 * @returns {Promise<any>}
 */
function ghApi(args, options = {}) {
  const { execFileImpl = execFile, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  return new Promise((resolve, reject) => {
    execFileImpl('gh', ['api', ...args], { timeout: timeoutMs, maxBuffer: MAX_BUFFER_BYTES }, (err, stdout, stderr) => {
      if (err) {
        const status = extractStatusFromStderr(stderr) ?? extractStatusFromStderr(err.message);
        let body = null;
        try { body = JSON.parse(stdout); } catch { /* stdout wasn't JSON (network/exec failure) */ }
        const message = body?.message || stderr?.trim() || err.message || 'gh api call failed';
        reject(new GithubApiError(message, { status, raw: stderr || stdout || err.message }));
        return;
      }
      try {
        resolve(stdout.trim() === '' ? null : JSON.parse(stdout));
      } catch (parseErr) {
        reject(new GithubApiError(`gh api returned non-JSON output: ${parseErr.message}`, { code: 'invalid_response', raw: stdout }));
      }
    });
  });
}

function encodeRef(ref) {
  return encodeURIComponent(ref);
}

function encodePath(p) {
  return p.split('/').map(encodeURIComponent).join('/');
}

/**
 * @param {{ execFileImpl?: Function }} [deps] - injectable for tests; real `gh` by default.
 */
export function createGithubConnector(deps = {}) {
  const call = (args) => ghApi(args, deps);

  return {
    host: 'github',

    /**
     * @param {{ owner: string, repo: string }} p
     * @returns {Promise<{ fullName: string, defaultBranch: string, private: boolean, htmlUrl: string, description: string|null }>}
     */
    async getRepository({ owner, repo }) {
      const data = await call([`repos/${owner}/${repo}`]);
      return {
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        private: data.private,
        htmlUrl: data.html_url,
        description: data.description ?? null,
      };
    },

    /**
     * Resolve a branch/tag/ref (or an already-full commit SHA) to its commit.
     * @param {{ owner: string, repo: string, ref: string }} p
     * @returns {Promise<{ sha: string, message: string, author: string|null, date: string|null }>}
     */
    async resolveCommit({ owner, repo, ref }) {
      const data = await call([`repos/${owner}/${repo}/commits/${encodeRef(ref)}`]);
      return {
        sha: data.sha,
        message: data.commit?.message ?? '',
        author: data.commit?.author?.name ?? null,
        date: data.commit?.author?.date ?? null,
      };
    },

    /**
     * @param {{ owner: string, repo: string, sha: string, recursive?: boolean }} p
     * @returns {Promise<{ truncated: boolean, entries: Array<{ path: string, type: string, size?: number, sha: string }> }>}
     */
    async getTree({ owner, repo, sha, recursive = true }) {
      const suffix = recursive ? '?recursive=1' : '';
      const data = await call([`repos/${owner}/${repo}/git/trees/${encodeRef(sha)}${suffix}`]);
      return {
        truncated: Boolean(data.truncated),
        entries: (data.tree ?? []).map(e => ({ path: e.path, type: e.type, size: e.size, sha: e.sha })),
      };
    },

    /**
     * @param {{ owner: string, repo: string, path: string, ref: string, maxBytes?: number }} p
     * @returns {Promise<{ path: string, sha: string, size: number, content: string, truncatedForBudget: boolean }>}
     */
    async getFileContent({ owner, repo, path, ref, maxBytes = 512_000 }) {
      const data = await call([`repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeRef(ref)}`]);
      if (Array.isArray(data)) {
        throw new GithubApiError(`"${path}" is a directory, not a file`, { code: 'is_directory' });
      }
      if (data.encoding !== 'base64') {
        throw new GithubApiError(`Unsupported content encoding "${data.encoding}" for "${path}"`, { code: 'unsupported_encoding' });
      }
      const full = Buffer.from(data.content, 'base64');
      const truncatedForBudget = full.length > maxBytes;
      const content = (truncatedForBudget ? full.subarray(0, maxBytes) : full).toString('utf-8');
      return { path: data.path, sha: data.sha, size: data.size, content, truncatedForBudget };
    },

    /**
     * @param {{ owner: string, repo: string, state?: 'open'|'closed'|'all', perPage?: number }} p
     * @returns {Promise<Array<{ number: number, title: string, state: string, htmlUrl: string, headRef?: string, baseRef?: string }>>}
     */
    async listPullRequests({ owner, repo, state = 'open', perPage = 30 }) {
      const data = await call([`repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}`]);
      return data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        htmlUrl: pr.html_url,
        headRef: pr.head?.ref,
        baseRef: pr.base?.ref,
      }));
    },

    /**
     * Real issues only (GitHub's issues endpoint also returns pull requests; those are filtered out).
     * @param {{ owner: string, repo: string, state?: 'open'|'closed'|'all', perPage?: number }} p
     * @returns {Promise<Array<{ number: number, title: string, state: string, htmlUrl: string }>>}
     */
    async listIssues({ owner, repo, state = 'open', perPage = 30 }) {
      const data = await call([`repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`]);
      return data
        .filter(i => !i.pull_request)
        .map(i => ({ number: i.number, title: i.title, state: i.state, htmlUrl: i.html_url }));
    },

    /**
     * @param {{ owner: string, repo: string, perPage?: number }} p
     * @returns {Promise<Array<{ id: number, name: string, status: string, conclusion: string|null, headSha: string, htmlUrl: string }>>}
     */
    async listWorkflowRuns({ owner, repo, perPage = 10 }) {
      const data = await call([`repos/${owner}/${repo}/actions/runs?per_page=${perPage}`]);
      return (data.workflow_runs ?? []).map(r => ({
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        headSha: r.head_sha,
        htmlUrl: r.html_url,
      }));
    },

    /**
     * A tagged GitHub release is evidence that a version was CUT, not proof it
     * was deployed anywhere — callers must not conflate the two (see
     * outcomes/deployment-record.js).
     * @param {{ owner: string, repo: string, perPage?: number }} p
     * @returns {Promise<Array<{ id: number, tagName: string, name: string|null, draft: boolean, prerelease: boolean, publishedAt: string|null, htmlUrl: string }>>}
     */
    async listReleases({ owner, repo, perPage = 10 }) {
      const data = await call([`repos/${owner}/${repo}/releases?per_page=${perPage}`]);
      return data.map(r => ({
        id: r.id,
        tagName: r.tag_name,
        name: r.name ?? null,
        draft: r.draft,
        prerelease: r.prerelease,
        publishedAt: r.published_at ?? null,
        htmlUrl: r.html_url,
      }));
    },

    /**
     * The GitHub Deployments API — real deployment-to-an-environment records,
     * when a repository's workflows use it (many do not; an empty array here
     * is an honest "no deployment evidence via this API", not an error).
     * @param {{ owner: string, repo: string, perPage?: number }} p
     * @returns {Promise<Array<{ id: number, ref: string, environment: string, sha: string, createdAt: string }>>}
     */
    async listDeployments({ owner, repo, perPage = 10 }) {
      const data = await call([`repos/${owner}/${repo}/deployments?per_page=${perPage}`]);
      return data.map(d => ({ id: d.id, ref: d.ref, environment: d.environment, sha: d.sha, createdAt: d.created_at }));
    },
  };
}
