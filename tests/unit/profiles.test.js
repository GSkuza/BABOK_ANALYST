/**
 * Profile integrity tests — every profile under profiles/ must be internally
 * consistent and all the files it points at must exist.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  DEFAULT_PROFILE_ID,
  buildProjectIdRegex,
  getIdPrefixes,
  getMaxStage,
  getStageFileNames,
  isProjectId,
  listProfileIds,
  loadProfile,
  profileIdFromJournal,
  profileIdFromProjectId,
  resolveProfilePath,
  validateProfile,
} from '../../cli/src/profiles.js';
import { RULE_REGISTRY } from '../../cli/src/validation/rules/index.js';
import { loadTemplatesForStage } from '../../cli/src/templates.js';
import { checkCompleteness } from '../../cli/src/quality/checks/completeness.js';

const KNOWN_RULE_IDS = new Set(Object.keys(RULE_REGISTRY));

describe('profile registry', () => {
  it('lists the default profile first', () => {
    const ids = listProfileIds();
    assert.ok(ids.length >= 1);
    assert.equal(ids[0], DEFAULT_PROFILE_ID);
  });

  it('id prefixes are unique across profiles', () => {
    const prefixes = getIdPrefixes();
    assert.equal(new Set(prefixes).size, prefixes.length, `duplicate prefixes: ${prefixes}`);
  });

  it('project-id regex accepts every prefix (incl. title-slug IDs) and rejects unknown ones', () => {
    const re = buildProjectIdRegex();
    for (const prefix of getIdPrefixes()) {
      assert.ok(re.test(`${prefix}-20260101-A2B3`), `should accept ${prefix}`);
      assert.ok(re.test(`${prefix}-MY_PROJECT-20260101-A2B3`), `should accept ${prefix} run-style ID`);
    }
    assert.ok(!isProjectId('XX-20260101-A2B3'));
    assert.ok(!isProjectId('BABOK_20260101'));
    assert.ok(!isProjectId('babok-20260101-a2b3'), 'lower-case is not a project dir');
  });

  it('maps project ids and journals back to a profile', () => {
    assert.equal(profileIdFromProjectId('BABOK-20260101-A2B3'), 'babok');
    assert.equal(profileIdFromProjectId('NOPE-20260101-A2B3'), null);
    assert.equal(profileIdFromJournal({ project_id: 'BABOK-20260101-A2B3' }), 'babok');
    assert.equal(profileIdFromJournal({}), DEFAULT_PROFILE_ID);
    for (const id of listProfileIds()) {
      assert.equal(profileIdFromJournal({ profile: id }), id);
    }
  });

  it('rejects an unknown profile id with the available list', () => {
    assert.throws(() => loadProfile('does-not-exist'), /Unknown profile.*Available: babok/);
  });

  it('validateProfile catches non-contiguous stages', () => {
    const bad = JSON.parse(JSON.stringify(loadProfile(DEFAULT_PROFILE_ID)));
    bad.stages.splice(3, 1);
    assert.throws(() => validateProfile(bad), /contiguous/);
  });
});

describe('default profile describes the current BABOK pipeline', () => {
  const p = loadProfile(DEFAULT_PROFILE_ID);
  it('has 9 stages 0..8 and prefix BABOK', () => {
    assert.equal(p.stages.length, 9);
    assert.equal(getMaxStage(p), 8);
    assert.equal(p.id_prefix, 'BABOK');
    assert.deepEqual(p.scoring.scorable_stages, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(getStageFileNames(p)[4], 'STAGE_04_Solution_Requirements.md');
  });
});

for (const id of listProfileIds()) {
  describe(`profile "${id}" integrity`, () => {
    const p = loadProfile(id);

    it('every stage prompt file exists', () => {
      const dir = resolveProfilePath(p, 'stages_dir');
      for (const s of p.stages) {
        assert.ok(fs.existsSync(path.join(dir, s.prompt_file)), `missing prompt ${s.prompt_file} in ${dir}`);
      }
    });

    it('system prompt, rubric, agents dir and templates manifest exist', () => {
      assert.ok(fs.existsSync(resolveProfilePath(p, 'system_prompt')), 'system_prompt');
      assert.ok(fs.existsSync(resolveProfilePath(p, 'rubric')), 'rubric');
      assert.ok(fs.existsSync(resolveProfilePath(p, 'agents_dir')), 'agents_dir');
      assert.ok(fs.existsSync(path.join(resolveProfilePath(p, 'templates_dir'), 'manifest.json')), 'templates manifest');
    });

    it('templates manifest covers exactly the profile stages with matching deliverable files', () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(resolveProfilePath(p, 'templates_dir'), 'manifest.json'), 'utf-8'));
      const manifestStages = Object.keys(manifest.stages).map(Number).sort((a, b) => a - b);
      assert.deepEqual(manifestStages, p.stages.map(s => s.stage));
      for (const s of p.stages) {
        assert.equal(manifest.stages[String(s.stage)].deliverable_file, s.deliverable_file, `stage ${s.stage} deliverable_file`);
      }
    });

    it('rubric has an entry for every scorable stage', () => {
      const rubric = JSON.parse(fs.readFileSync(resolveProfilePath(p, 'rubric'), 'utf-8'));
      for (const n of p.scoring.scorable_stages) {
        assert.ok(rubric.stages[`stage${n}`], `rubric missing stage${n}`);
        assert.ok(Array.isArray(rubric.stages[`stage${n}`].required_sections), `stage${n} required_sections`);
      }
    });

    it('every scorable stage skeleton passes the completeness check against its rubric', () => {
      for (const n of p.scoring.scorable_stages) {
        const { text, requiredSections } = loadTemplatesForStage(n, { includeModules: false, profile: p });
        assert.ok(requiredSections.length > 0, `stage ${n} has no required sections`);
        const { score, issues } = checkCompleteness(text, requiredSections);
        assert.equal(score, 100, `stage ${n} skeleton missing: ${issues.map(i => i.message).join('; ')}`);
      }
    });

    it('every module referenced by the manifest exists', () => {
      const templatesDir = resolveProfilePath(p, 'templates_dir');
      const manifest = JSON.parse(fs.readFileSync(path.join(templatesDir, 'manifest.json'), 'utf-8'));
      const rels = new Set();
      for (const cfg of Object.values(manifest.stages)) {
        rels.add(cfg.primary);
        for (const m of cfg.modules ?? []) rels.add(m);
      }
      for (const pack of Object.values(manifest.industry_supplements ?? {})) {
        for (const files of Object.values(pack)) for (const f of files) rels.add(f);
      }
      for (const rel of rels) {
        assert.ok(fs.existsSync(path.join(templatesDir, rel)), `missing template ${rel}`);
      }
    });

    it('every validation rule id is registered', () => {
      for (const rule of p.validation.rules) {
        assert.ok(KNOWN_RULE_IDS.has(rule.id), `unknown rule ${rule.id}`);
      }
    });

    it('orchestrator has a stage config for every pipeline stage', () => {
      const agentsDir = resolveProfilePath(p, 'agents_dir');
      const nums = new Set();
      for (const group of p.orchestrator.pipeline) {
        for (const key of group.stages) nums.add(Number(/^stage(\d+)/.exec(key)[1]));
      }
      for (const n of nums) {
        assert.ok(fs.existsSync(path.join(agentsDir, `stage${n}_config.json`)), `missing stage${n}_config.json`);
      }
    });
  });
}
