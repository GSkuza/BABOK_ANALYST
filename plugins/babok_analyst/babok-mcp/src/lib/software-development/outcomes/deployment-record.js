/**
 * Deployment evidence for the software-development profile's Stage 6 (Outcome
 * & Context Reconciliation).
 *
 * Deliberately keeps three GitHub-observable events distinct instead of
 * collapsing them into one "deployed" boolean, per the profile's own
 * guardrail ("merge, sukces CI, utworzenie release i udane wdrożenie to różne
 * zdarzenia" — see profiles/software-development/agents/quality_audit_agent.md):
 *   - a merged pull request
 *   - a tagged/published release
 *   - a recorded deployment (GitHub's Deployments API, environment-scoped)
 * A repository that never uses the Deployments API will legitimately have zero
 * deployment evidence via GitHub — that is reported as "no_deployment_api_data",
 * not silently treated as "not deployed" or padded with an invented status.
 *
 * This file is byte-identical in
 * cli/src/software-development/outcomes/deployment-record.js and
 * babok-mcp/src/lib/software-development/outcomes/deployment-record.js
 * (enforced by tests/unit/lib-parity.test.js).
 */

/**
 * @param {{ connector: object, owner: string, repo: string, sinceRef?: string, perPage?: number }} options
 * @returns {Promise<{
 *   deployments: Array<{ id: number, ref: string, environment: string, sha: string, createdAt: string }>,
 *   releases: Array<{ tagName: string, publishedAt: string|null, htmlUrl: string, prerelease: boolean }>,
 *   status: 'deployment_confirmed' | 'release_only_no_deployment_api_data' | 'no_evidence',
 *   note: string,
 * }>}
 */
export async function getDeploymentEvidence(options) {
  const { connector, owner, repo, perPage = 10 } = options;

  const [deployments, releases] = await Promise.all([
    connector.listDeployments({ owner, repo, perPage }),
    connector.listReleases({ owner, repo, perPage }),
  ]);

  const publishedReleases = releases.filter(r => !r.draft);

  if (deployments.length > 0) {
    return {
      deployments,
      releases: publishedReleases,
      status: 'deployment_confirmed',
      note: `${deployments.length} deployment record(s) found via the GitHub Deployments API.`,
    };
  }

  if (publishedReleases.length > 0) {
    return {
      deployments: [],
      releases: publishedReleases,
      status: 'release_only_no_deployment_api_data',
      note: 'A release/tag exists, which is evidence a version was cut — it is NOT evidence the change was deployed to any environment. '
        + 'This repository has no records via the GitHub Deployments API; confirm deployment through another explicit source '
        + '(a platform-specific deployment log, or a signed operator statement) before recording Stage 6 as deployed.',
    };
  }

  return {
    deployments: [],
    releases: [],
    status: 'no_evidence',
    note: 'No release and no GitHub Deployments API record found for this repository. Record Stage 6 deployment status as pending.',
  };
}
