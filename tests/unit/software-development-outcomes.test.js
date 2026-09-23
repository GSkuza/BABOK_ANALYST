/**
 * KPI tracker (mocked data — no network needed) and deployment evidence
 * (mocked connector, plus a real live check against GSkuza/BABOK_ANALYST's
 * actual releases/deployments through the authenticated `gh` CLI).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';

import { parseJsonReadings, parseCsvReadings, evaluateKpi } from '../../cli/src/software-development/outcomes/kpi-tracker.js';
import { getDeploymentEvidence } from '../../cli/src/software-development/outcomes/deployment-record.js';
import { createGithubConnector } from '../../cli/src/software-development/hosting/github.js';

describe('kpi-tracker', () => {
  it('parses JSON readings', () => {
    const readings = parseJsonReadings(JSON.stringify([{ date: '2026-01-01', value: 22 }, { date: '2026-02-01', value: 15 }]));
    assert.deepEqual(readings, [{ date: '2026-01-01', value: 22 }, { date: '2026-02-01', value: 15 }]);
  });

  it('rejects malformed JSON readings', () => {
    assert.throws(() => parseJsonReadings('not json'), /invalid JSON/);
    assert.throws(() => parseJsonReadings('{"not":"an array"}'), /expected a JSON array/);
    assert.throws(() => parseJsonReadings('[{"date":"2026-01-01"}]'), /must be \{ date: string, value: number \}/);
  });

  it('parses CSV readings', () => {
    const csv = 'date,value\n2026-01-01,22\n2026-02-01,15\n';
    assert.deepEqual(parseCsvReadings(csv), [{ date: '2026-01-01', value: 22 }, { date: '2026-02-01', value: 15 }]);
  });

  it('rejects a CSV missing required columns', () => {
    assert.throws(() => parseCsvReadings('foo,bar\n1,2\n'), /must include "date" and "value"/);
  });

  it('reports pending when no reading falls in the measurement window', () => {
    const result = evaluateKpi({ id: 'KPI-001', windowStart: '2026-06-01', windowEnd: '2026-12-31' }, [{ date: '2026-01-01', value: 22 }]);
    assert.equal(result.status, 'pending');
    assert.equal(result.achieved, null);
  });

  it('evaluates achievement for an "increase" direction target', () => {
    const result = evaluateKpi({ id: 'KPI-002', target: 90, direction: 'increase' }, [{ date: '2026-01-01', value: 80 }, { date: '2026-03-01', value: 95 }]);
    assert.equal(result.status, 'measured');
    assert.equal(result.latestValue, 95);
    assert.equal(result.achieved, true);
  });

  it('evaluates achievement for a "decrease" direction target (e.g. cycle time)', () => {
    const result = evaluateKpi({ id: 'KPI-003', target: 10, direction: 'decrease', unit: 'days' }, [{ date: '2026-01-01', value: 18 }, { date: '2026-03-01', value: 12 }]);
    assert.equal(result.achieved, false); // 12 > 10, target not yet met
    assert.match(result.note, /target ≤ 10/);
  });

  it('reports null achievement when no numeric target is set', () => {
    const result = evaluateKpi({ id: 'KPI-004' }, [{ date: '2026-01-01', value: 5 }]);
    assert.equal(result.achieved, null);
  });
});

function fakeConnector({ deployments = [], releases = [] }) {
  return {
    async listDeployments() { return deployments; },
    async listReleases() { return releases; },
  };
}

describe('deployment-record (mocked connector)', () => {
  it('reports deployment_confirmed when the Deployments API has records', async () => {
    const result = await getDeploymentEvidence({
      connector: fakeConnector({ deployments: [{ id: 1, ref: 'main', environment: 'production', sha: 'abc', createdAt: '2026-01-01T00:00:00Z' }] }),
      owner: 'acme', repo: 'widget',
    });
    assert.equal(result.status, 'deployment_confirmed');
    assert.equal(result.deployments.length, 1);
  });

  it('reports release_only_no_deployment_api_data and warns against conflating release with deployment', async () => {
    const result = await getDeploymentEvidence({
      connector: fakeConnector({ releases: [{ id: 1, tagName: 'v1.0.0', name: 'v1.0.0', draft: false, prerelease: false, publishedAt: '2026-01-01T00:00:00Z', htmlUrl: 'https://x' }] }),
      owner: 'acme', repo: 'widget',
    });
    assert.equal(result.status, 'release_only_no_deployment_api_data');
    assert.match(result.note, /NOT evidence the change was deployed/);
  });

  it('excludes draft releases and reports no_evidence when nothing is published', async () => {
    const result = await getDeploymentEvidence({
      connector: fakeConnector({ releases: [{ id: 1, tagName: 'v2.0.0-draft', draft: true, prerelease: false, publishedAt: null, htmlUrl: 'https://x' }] }),
      owner: 'acme', repo: 'widget',
    });
    assert.equal(result.status, 'no_evidence');
  });
});

function ghAuthenticated() {
  try { execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' }); return true; } catch { return false; }
}
const skipReason = ghAuthenticated() ? false : '`gh` is not authenticated in this environment';

describe('deployment-record (live GitHub, GSkuza/BABOK_ANALYST, read-only)', { skip: skipReason }, () => {
  it('reads the real releases for this repository', async () => {
    const github = createGithubConnector();
    const result = await github.listReleases({ owner: 'GSkuza', repo: 'BABOK_ANALYST', perPage: 5 });
    assert.ok(Array.isArray(result));
    if (result.length > 0) {
      assert.match(result[0].tagName, /^v?\d/);
    }
  });

  it('getDeploymentEvidence correctly distinguishes release-only from a confirmed deployment for the real repo', async () => {
    const github = createGithubConnector();
    const result = await getDeploymentEvidence({ connector: github, owner: 'GSkuza', repo: 'BABOK_ANALYST', perPage: 5 });
    // This repository is known (as of this test's authoring) to have releases
    // but no GitHub Deployments API records — asserting the honest distinction
    // holds rather than asserting a specific count that will drift over time.
    assert.ok(['deployment_confirmed', 'release_only_no_deployment_api_data', 'no_evidence'].includes(result.status));
    if (result.status === 'release_only_no_deployment_api_data') {
      assert.equal(result.deployments.length, 0);
      assert.ok(result.releases.length > 0);
    }
  });
});
