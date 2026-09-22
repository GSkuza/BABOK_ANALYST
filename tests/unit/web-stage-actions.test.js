import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { StageActionError, runStageAction } from '../../web/lib/stage-actions.ts';

describe('web stage action delegation', () => {
  it('routes approve requests through the CLI approval command', async () => {
    const calls = [];
    await runStageAction('BABOK-20260922-ABCD', 0, 'approve', undefined, async (...args) => {
      calls.push(args);
      return { stdout: '', stderr: '' };
    });

    assert.equal(calls.length, 1);
    const [cmd, argv, options] = calls[0];
    assert.equal(cmd, 'node');
    assert.deepEqual(argv.slice(1), ['approve', 'BABOK-20260922-ABCD', '0', '--attestor', 'Web UI']);
    assert.match(argv[0], /cli[\\/]bin[\\/]babok\.js$/);
    assert.ok(options.cwd.endsWith('BABOK_ANALYST'));
  });

  it('maps CLI failures to HTTP-friendly status codes', async () => {
    await assert.rejects(
      runStageAction('BABOK-20260922-ABCD', 0, 'approve', undefined, async () => {
        const error = new Error('failed');
        error.stderr = 'Error: Stage is already approved\n';
        throw error;
      }),
      (error) => {
        assert.ok(error instanceof StageActionError);
        assert.equal(error.status, 409);
        assert.equal(error.message, 'Stage is already approved');
        return true;
      },
    );
  });
});
