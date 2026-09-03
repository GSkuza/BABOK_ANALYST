/**
 * Knowledge loader — profile-declared extra categories must be loaded and
 * rendered into the prompt text; built-in categories must be unaffected.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRelevantKnowledge, formatKnowledgeForPrompt } from '../../cli/src/lib/knowledge-loader.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const consultingLike = { knowledge: { extra_categories: ['frameworks', 'change_management'] } };

describe('knowledge-loader extra categories', () => {
  it('ignores extra categories when no profile is given (legacy behaviour)', () => {
    const k = getRelevantKnowledge({ frameworks: ['adkar'] });
    assert.deepEqual(Object.keys(k).sort(), ['benchmarks', 'industries', 'regulations', 'technology']);
  });

  it('loads frameworks and change_management declared by the profile', () => {
    const k = getRelevantKnowledge({ frameworks: ['ADKAR', 'kotter_8step'], change_management: ['resistance_patterns'] }, consultingLike);
    assert.equal(k.frameworks.length, 2);
    assert.equal(k.frameworks[0].framework, 'ADKAR');
    assert.equal(k.change_management.length, 1);
    assert.equal(k.change_management[0].topic, 'Resistance Patterns');
  });

  it('renders framework steps and change-management items into the prompt text', () => {
    const k = getRelevantKnowledge({ frameworks: ['adkar', 'mckinsey_7s'], change_management: ['change_readiness_benchmarks'] }, consultingLike);
    const text = formatKnowledgeForPrompt(k, 20000);
    assert.match(text, /# Knowledge: Frameworks/);
    assert.match(text, /\*\*Framework:\*\* ADKAR/);
    assert.match(text, /1\. \*\*Awareness\*\*/);
    assert.match(text, /### Shared Values/);
    assert.match(text, /# Knowledge: Change_management/);
    assert.match(text, /\*\*Topic:\*\* Change Readiness Benchmarks/);
    assert.match(text, /Prosci/);
  });

  it('silently skips unknown keys in an extra category', () => {
    const k = getRelevantKnowledge({ frameworks: ['does_not_exist'] }, consultingLike);
    assert.deepEqual(k.frameworks, []);
  });
});

describe('knowledge files match their declared shape', () => {
  for (const [dir, requiredKeys] of [
    ['frameworks', ['framework', 'description', 'best_for']],
    ['change_management', ['topic', 'description']],
  ]) {
    const files = fs.readdirSync(path.join(ROOT, 'knowledge', dir)).filter(f => f.endsWith('.json'));
    it(`${dir}/ has files and each has ${requiredKeys.join(', ')}`, () => {
      assert.ok(files.length > 0);
      for (const f of files) {
        const obj = JSON.parse(fs.readFileSync(path.join(ROOT, 'knowledge', dir, f), 'utf-8'));
        for (const key of requiredKeys) assert.ok(obj[key], `${dir}/${f} missing ${key}`);
      }
    });
  }
});
