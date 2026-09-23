/**
 * Authorisation-gated command execution for the software-development profile.
 *
 * Runs one command in one working directory and returns a structured record
 * (exit code, stdout/stderr, duration) instead of a bare success/failure flag
 * — an LLM's opinion about whether "the tests passed" is never a substitute
 * for the actual exit code here.
 *
 * Every call requires execution_authorization.js's "run_tests" scope to have
 * been explicitly granted for the initiative, and the requested command must
 * be in that grant's `allowedCommands` — two independent checks (an
 * authorisation gate and a whitelist), so neither alone is the only thing
 * standing between "approved a plan" and "ran an arbitrary command".
 *
 * This does not provide sandbox-level isolation: it runs the command as this
 * process's own user with a minimised environment. Treat the isolated
 * environment described in the software-development plan as the preferred
 * option and this as the explicitly-consented local fallback, per Stage 4's
 * Execution Authorisation Status.
 *
 * This file is byte-identical in cli/src/software-development/runtime/code-executor.js
 * and babok-mcp/src/lib/software-development/runtime/code-executor.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import { execFile } from 'child_process';
import path from 'path';
import { assertAuthorized } from './execution-authorization.js';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

/**
 * Minimise the child process environment: pass through only what's needed to
 * find and run the command, never this process's own provider/hosting tokens.
 * @param {NodeJS.ProcessEnv} sourceEnv
 */
function minimalEnv(sourceEnv) {
  const passthroughKeys = ['PATH', 'PATHEXT', 'HOME', 'USERPROFILE', 'TEMP', 'TMP', 'SystemRoot', 'ComSpec'];
  const env = {};
  for (const key of passthroughKeys) {
    if (sourceEnv[key] !== undefined) env[key] = sourceEnv[key];
  }
  return env;
}

/**
 * @param {string} initiativeId
 * @param {{ cwd: string, command: string, args?: string[], timeoutMs?: number, execFileImpl?: Function }} request
 * @returns {Promise<{
 *   command: string, args: string[], cwd: string,
 *   exitCode: number|null, signal: string|null,
 *   stdout: string, stderr: string, durationMs: number,
 *   startedAt: string, completedAt: string,
 * }>}
 */
export async function runCommand(initiativeId, request) {
  const { cwd, command, args = [], timeoutMs = DEFAULT_TIMEOUT_MS, execFileImpl = execFile } = request;

  const authorization = assertAuthorized(initiativeId, 'run_tests');
  const allowedCommands = authorization.constraints.allowedCommands ?? [];
  if (!allowedCommands.includes(command)) {
    throw new Error(
      `runCommand: "${command}" is not in the run_tests authorisation's allowedCommands (${allowedCommands.join(', ') || '(none)'}) `
      + `for initiative "${initiativeId}". Record a new setExecutionAuthorization() grant to add it.`,
    );
  }
  const allowedDirectories = authorization.constraints.allowedDirectories;
  if (Array.isArray(allowedDirectories) && allowedDirectories.length > 0 && !allowedDirectories.some(dir => cwd === dir || cwd.startsWith(dir + path.sep))) {
    throw new Error(`runCommand: cwd "${cwd}" is outside the run_tests authorisation's allowedDirectories`);
  }

  const startedAt = new Date();
  return new Promise((resolve, reject) => {
    execFileImpl(
      command,
      args,
      { cwd, timeout: timeoutMs, maxBuffer: MAX_OUTPUT_BYTES, env: minimalEnv(process.env) },
      (err, stdout, stderr) => {
        const completedAt = new Date();
        const durationMs = completedAt.getTime() - startedAt.getTime();
        if (err && typeof err.code !== 'number' && !err.killed) {
          // Command could not even be spawned (e.g. not found) — this is
          // distinct from "ran and exited non-zero", which is a normal result below.
          reject(new Error(`runCommand: failed to spawn "${command}": ${err.message}`));
          return;
        }
        resolve({
          command,
          args,
          cwd,
          exitCode: err ? (typeof err.code === 'number' ? err.code : null) : 0,
          signal: err?.signal ?? null,
          stdout,
          stderr,
          durationMs,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
        });
      },
    );
  });
}
