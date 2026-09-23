/**
 * Autonomous Stage 1 (Product & Repository Baseline) builder for the
 * software-development profile.
 *
 * Orchestrates, per repository in a product: repository-analyzer.js (mechanical,
 * evidence-backed facts) plus an optional LLM synthesis pass (business/technology/
 * architecture/SDLC narrative grounded in that evidence — never replacing it).
 * Persists the result as a new, immutable baseline via product-store.js.
 *
 * Works with zero LLM configured: the mechanical evidence (manifests, CI config,
 * test directories, pinned commits) is itself a valid, useful baseline. An LLM,
 * when available, only adds readable narrative on top — it is never the sole
 * source of a claim.
 *
 * This file is byte-identical in cli/src/software-development/baseline-builder.js
 * and babok-mcp/src/lib/software-development/baseline-builder.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import { analyzeRepository } from './repository-analyzer.js';
import { createBaseline, readProduct } from './product-store.js';

const NARRATIVE_SYSTEM_PROMPT = `You are the Stage 1 (Product & Repository Baseline) autonomous agent of the
BABOK Analyst software-development profile. You are given mechanically-gathered,
cited evidence about one or more repositories (manifests, CI config, test
directories, pinned commits) — never the full source tree. Write four short
sections: Business Context, Technology Context, Architecture Context, SDLC
Context. Every sentence that states a fact must reference an EV-NNN id from the
evidence provided. Where you cannot ground a statement in the given evidence,
either omit it or explicitly label it "Hypothesis:" or "Assumption:". Do not
invent business purpose beyond what repository names, manifests and structure
reasonably suggest — label such inferences as hypotheses.`;

/**
 * @param {Array<{ repository_id: string, analysis: object }>} perRepo
 * @returns {string}
 */
function buildNarrativeUserPrompt(perRepo) {
  const lines = ['Evidence gathered per repository:', ''];
  for (const { repository_id, analysis } of perRepo) {
    lines.push(`## Repository "${repository_id}" (${analysis.repository.owner}/${analysis.repository.repo} @ ${analysis.repository.commitSha.slice(0, 12)})`);
    lines.push(`Files: ${analysis.fileCount}${analysis.treeTruncated ? ' (truncated listing)' : ''}`);
    for (const m of analysis.manifests) lines.push(`- Manifest ${m.path}: ${m.claim}`);
    lines.push(analysis.ciConfigPaths.length > 0 ? `- CI/CD: ${analysis.ciConfigPaths.join(', ')}` : '- CI/CD: none detected');
    lines.push(analysis.testDirectories.length > 0 ? `- Test directories: ${analysis.testDirectories.join(', ')}` : '- Test directories: none detected');
    lines.push('- Evidence ids: ' + analysis.evidence.map(e => e.id).join(', '));
    lines.push('');
  }
  lines.push('Write the four sections now, citing EV-NNN ids inline.');
  return lines.join('\n');
}

/**
 * @param {{
 *   productId: string,
 *   repositories: Array<{ id: string, host: string, owner: string, name: string, ref?: string }>,
 *   connectors: { github?: object, gitlab?: object, [host: string]: object },
 *   llmClient?: { chat: (system: string, user: string) => Promise<string> },
 * }} options
 * @returns {Promise<{ baseline: object, analyses: Array<{ repository_id: string, analysis: object }>, narrative: string|null }>}
 */
export async function buildBaseline(options) {
  const { productId, repositories, connectors, llmClient } = options;
  readProduct(productId); // throws if the product does not exist

  let evidenceCounter = 1;
  const repositorySnapshots = [];
  const allEvidence = [];
  const analyses = [];
  const excludedOverall = [];

  for (const repoRef of repositories) {
    const connector = connectors[repoRef.host];
    if (!connector) {
      throw new Error(`buildBaseline: no connector configured for host "${repoRef.host}" (repository "${repoRef.id}")`);
    }
    const analysis = await analyzeRepository({
      connector,
      owner: repoRef.owner,
      repo: repoRef.name,
      ref: repoRef.ref,
      repositoryId: repoRef.id,
      startEvidenceCounter: evidenceCounter,
    });
    evidenceCounter += analysis.evidence.length;

    repositorySnapshots.push({
      repository_id: repoRef.id,
      ref: analysis.repository.resolvedRef,
      commit_sha: analysis.repository.commitSha,
      dirty: false,
    });
    allEvidence.push(...analysis.evidence);
    analyses.push({ repository_id: repoRef.id, analysis });
    excludedOverall.push(...analysis.excluded.map(e => `[${repoRef.id}] ${e}`));
  }

  let narrative = null;
  if (llmClient) {
    narrative = await llmClient.chat(NARRATIVE_SYSTEM_PROMPT, buildNarrativeUserPrompt(analyses));
  }

  const baseline = createBaseline(productId, {
    repositories: repositorySnapshots,
    evidence: allEvidence,
    ...(narrative !== null ? { narrative } : {}),
    ...(excludedOverall.length > 0 ? { excluded: excludedOverall } : {}),
  });

  return { baseline, analyses, narrative };
}
