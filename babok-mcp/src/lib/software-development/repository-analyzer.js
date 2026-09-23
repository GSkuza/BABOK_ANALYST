/**
 * Mechanical (LLM-independent) repository analysis for the software-development
 * profile's Stage 1 autonomous baseline.
 *
 * This module only reports what it can directly cite from the repository:
 * manifests it can parse, CI/CD configuration files it finds, likely test
 * directories. It never infers business intent or architecture narrative —
 * that synthesis step (if an LLM is available) consumes this module's output
 * as its evidence, it does not replace it. Every finding here can be traced
 * back to a specific evidence-ledger row (repository, ref/commit, path).
 *
 * Deliberately conservative: an unrecognised manifest format is reported as
 * "present" evidence only (no invented dependency list); a language this
 * module has no parser for still contributes its file-tree evidence.
 *
 * This file is byte-identical in cli/src/software-development/repository-analyzer.js
 * and babok-mcp/src/lib/software-development/repository-analyzer.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

const MANIFEST_PARSERS = [
  { pattern: /(^|\/)package\.json$/, kind: 'npm' },
  { pattern: /(^|\/)requirements\.txt$/, kind: 'pip' },
  { pattern: /(^|\/)pyproject\.toml$/, kind: 'python-project' },
  { pattern: /(^|\/)go\.mod$/, kind: 'go-module' },
  { pattern: /(^|\/)Cargo\.toml$/, kind: 'cargo' },
  { pattern: /(^|\/)pom\.xml$/, kind: 'maven' },
  { pattern: /(^|\/)build\.gradle(\.kts)?$/, kind: 'gradle' },
  { pattern: /(^|\/)composer\.json$/, kind: 'composer' },
  { pattern: /(^|\/)Gemfile$/, kind: 'bundler' },
];

const CI_PATTERNS = [
  /^\.github\/workflows\/.+\.ya?ml$/,
  /^\.gitlab-ci\.ya?ml$/,
  /^\.circleci\/config\.ya?ml$/,
  /^azure-pipelines\.ya?ml$/,
  /^Jenkinsfile$/,
];

const TEST_DIR_PATTERN = /(^|\/)(tests?|spec|__tests__)(\/|$)/i;
const MAX_MANIFESTS_READ = 12;
const MAX_MANIFEST_BYTES = 100_000;

/** @param {Array<{path:string,type:string}>} entries */
function detectManifests(entries) {
  const found = [];
  for (const entry of entries) {
    if (entry.type !== 'blob') continue;
    for (const { pattern, kind } of MANIFEST_PARSERS) {
      if (pattern.test(entry.path)) {
        found.push({ path: entry.path, kind });
        break;
      }
    }
  }
  return found;
}

/** @param {Array<{path:string,type:string}>} entries */
function detectCiConfig(entries) {
  return entries
    .filter(e => e.type === 'blob' && CI_PATTERNS.some(p => p.test(e.path)))
    .map(e => e.path);
}

/** @param {Array<{path:string,type:string}>} entries */
function detectTestDirectories(entries) {
  const dirs = new Set();
  for (const entry of entries) {
    const m = TEST_DIR_PATTERN.exec(entry.path);
    if (m) {
      const idx = entry.path.toLowerCase().indexOf(m[2].toLowerCase());
      dirs.add(entry.path.slice(0, idx + m[2].length));
    }
  }
  return [...dirs].sort();
}

/**
 * @param {string} kind
 * @param {string} content
 * @returns {{ claim: string, details: object }}
 */
function summarizeManifestContent(kind, content) {
  if (kind === 'npm') {
    try {
      const pkg = JSON.parse(content);
      const deps = Object.keys(pkg.dependencies ?? {});
      const devDeps = Object.keys(pkg.devDependencies ?? {});
      const scripts = Object.keys(pkg.scripts ?? {});
      return {
        claim: `npm package "${pkg.name ?? '(unnamed)'}"${pkg.version ? ` v${pkg.version}` : ''}: ${deps.length} runtime dependencies, ${devDeps.length} dev dependencies, scripts: ${scripts.join(', ') || '(none)'}`,
        details: { name: pkg.name ?? null, version: pkg.version ?? null, dependencies: deps, devDependencies: devDeps, scripts },
      };
    } catch {
      return { claim: 'package.json present but could not be parsed as JSON', details: { parseError: true } };
    }
  }
  if (kind === 'go-module') {
    const m = /^module\s+(\S+)/m.exec(content);
    return { claim: m ? `Go module "${m[1]}"` : 'go.mod present', details: { module: m?.[1] ?? null } };
  }
  if (kind === 'cargo') {
    const m = /\[package\][^[]*name\s*=\s*"([^"]+)"/s.exec(content);
    return { claim: m ? `Cargo package "${m[1]}"` : 'Cargo.toml present', details: { name: m?.[1] ?? null } };
  }
  // Every other recognised manifest kind: report presence only — no parser implemented,
  // and an unverified guess about its dependency list would be worse than an honest gap.
  return { claim: `${kind} manifest present (no dependency parser implemented for this format)`, details: {} };
}

/**
 * @param {{
 *   connector: object, owner: string, repo: string, ref?: string, repositoryId: string,
 *   maxManifests?: number, startEvidenceCounter?: number,
 * }} options
 * @returns {Promise<{
 *   repository: { owner: string, repo: string, resolvedRef: string, commitSha: string, defaultBranch: string },
 *   fileCount: number, treeTruncated: boolean,
 *   manifests: Array<{ path: string, kind: string, claim: string, details: object }>,
 *   ciConfigPaths: string[], testDirectories: string[],
 *   evidence: Array<{ id: string, repository_id: string, ref: string, path: string, claim: string, type: string }>,
 *   excluded: string[],
 * }>}
 */
export async function analyzeRepository(options) {
  const { connector, owner, repo, ref, repositoryId, maxManifests = MAX_MANIFESTS_READ } = options;
  let evCounter = options.startEvidenceCounter ?? 1;
  const nextEvId = () => `EV-${String(evCounter++).padStart(3, '0')}`;
  const excluded = [];

  const repoMeta = await connector.getRepository({ owner, repo });
  const resolvedRef = ref || repoMeta.defaultBranch;
  const commit = await connector.resolveCommit({ owner, repo, ref: resolvedRef });
  const tree = await connector.getTree({ owner, repo, sha: commit.sha });
  if (tree.truncated) excluded.push('file tree truncated by host pagination/size limit — analysis covers a partial listing');

  const evidence = [];
  const manifestCandidates = detectManifests(tree.entries);
  const manifestsToRead = manifestCandidates.slice(0, maxManifests);
  if (manifestCandidates.length > manifestsToRead.length) {
    excluded.push(`${manifestCandidates.length - manifestsToRead.length} additional manifest file(s) not read (budget cap ${maxManifests})`);
  }

  const manifests = [];
  for (const candidate of manifestsToRead) {
    const file = await connector.getFileContent({ owner, repo, path: candidate.path, ref: commit.sha, maxBytes: MAX_MANIFEST_BYTES });
    if (file.truncatedForBudget) excluded.push(`${candidate.path} read truncated at ${MAX_MANIFEST_BYTES} bytes`);
    const summary = summarizeManifestContent(candidate.kind, file.content);
    const id = nextEvId();
    evidence.push({ id, repository_id: repositoryId, ref: commit.sha, path: candidate.path, claim: summary.claim, type: 'fact' });
    manifests.push({ path: candidate.path, kind: candidate.kind, claim: summary.claim, details: summary.details });
  }

  const ciConfigPaths = detectCiConfig(tree.entries);
  if (ciConfigPaths.length > 0) {
    evidence.push({
      id: nextEvId(),
      repository_id: repositoryId,
      ref: commit.sha,
      path: ciConfigPaths[0],
      claim: `CI/CD configuration present: ${ciConfigPaths.join(', ')}`,
      type: 'fact',
    });
  } else {
    evidence.push({
      id: nextEvId(),
      repository_id: repositoryId,
      ref: commit.sha,
      path: '(repository root)',
      claim: 'No recognised CI/CD configuration file found at the paths this analyser checks',
      type: 'assumption',
    });
  }

  const testDirectories = detectTestDirectories(tree.entries);
  evidence.push({
    id: nextEvId(),
    repository_id: repositoryId,
    ref: commit.sha,
    path: testDirectories[0] ?? '(repository root)',
    claim: testDirectories.length > 0
      ? `Likely test director${testDirectories.length === 1 ? 'y' : 'ies'}: ${testDirectories.join(', ')}`
      : 'No directory matching common test-naming conventions was found',
    type: testDirectories.length > 0 ? 'fact' : 'assumption',
  });

  return {
    repository: { owner, repo, resolvedRef, commitSha: commit.sha, defaultBranch: repoMeta.defaultBranch },
    fileCount: tree.entries.length,
    treeTruncated: tree.truncated,
    manifests,
    ciConfigPaths,
    testDirectories,
    evidence,
    excluded,
  };
}
