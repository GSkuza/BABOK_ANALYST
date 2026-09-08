/**
 * File locking module for BABOK Agent CLI
 * Prevents concurrent stage edits when multiple team members share a project directory.
 *
 * Lock file: <projectDir>/.stage_N.lock
 * Format:    { locked_by, hostname, pid, locked_at }
 *
 * Staleness: locks older than LOCK_STALE_MINUTES are considered stale and auto-released.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getProjectDir } from './project.js';

export const LOCK_STALE_MINUTES = 15;
const LOCK_REFRESH_MS = 60 * 1000;

function lockFilePath(projectId, stageNumber, dir) {
  return path.join(dir || getProjectDir(projectId), `.stage_${stageNumber}.lock`);
}

export function checkLock(projectId, stageNumber, dir) {
  const lockPath = lockFilePath(projectId, stageNumber, dir);
  if (!fs.existsSync(lockPath)) return null;

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return null;
  }

  const ageMs = Date.now() - new Date(lock.locked_at).getTime();
  if (ageMs > LOCK_STALE_MINUTES * 60 * 1000) {
    try { fs.unlinkSync(lockPath); } catch {}
    return null;
  }

  return lock;
}

export function acquireLock(projectId, stageNumber, dir) {
  const existing = checkLock(projectId, stageNumber, dir);
  if (existing) {
    if (existing.pid === process.pid && existing.hostname === os.hostname()) {
      return { acquired: true };
    }
    return { acquired: false, lock: existing };
  }

  const lock = {
    locked_by: os.userInfo().username,
    hostname: os.hostname(),
    pid: process.pid,
    locked_at: new Date().toISOString(),
  };

  const lockPath = lockFilePath(projectId, stageNumber, dir);
  try {
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), { flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') {
      const concurrent = checkLock(projectId, stageNumber, dir);
      return { acquired: false, lock: concurrent };
    }
    throw err;
  }

  return { acquired: true };
}

export function refreshLock(projectId, stageNumber, dir) {
  const lockPath = lockFilePath(projectId, stageNumber, dir);
  if (!fs.existsSync(lockPath)) return false;

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return false;
  }

  if (lock.pid !== process.pid || lock.hostname !== os.hostname()) return false;
  lock.locked_at = new Date().toISOString();
  try {
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function releaseLock(projectId, stageNumber, dir) {
  const lockPath = lockFilePath(projectId, stageNumber, dir);
  if (!fs.existsSync(lockPath)) return;

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return;
  }

  if (lock.pid === process.pid && lock.hostname === os.hostname()) {
    try { fs.unlinkSync(lockPath); } catch {}
  }
}

export async function withStageLock(projectId, stageNumber, dirOrFn, maybeFn) {
  const dir = typeof dirOrFn === 'function' ? undefined : dirOrFn;
  const fn = typeof dirOrFn === 'function' ? dirOrFn : maybeFn;
  if (typeof fn !== 'function') throw new Error('withStageLock requires a callback.');

  const lockResult = acquireLock(projectId, stageNumber, dir);
  if (!lockResult.acquired) {
    const err = new Error(`Stage ${stageNumber} is locked by another user: ${formatLockInfo(lockResult.lock)}`);
    err.code = 'STAGE_LOCKED';
    err.lock = lockResult.lock;
    throw err;
  }

  const refreshTimer = setInterval(() => {
    refreshLock(projectId, stageNumber, dir);
  }, LOCK_REFRESH_MS);
  refreshTimer.unref?.();

  try {
    return await fn();
  } finally {
    clearInterval(refreshTimer);
    releaseLock(projectId, stageNumber, dir);
  }
}

export function formatLockInfo(lock) {
  if (!lock) return '(unknown)';
  const age = Math.round((Date.now() - new Date(lock.locked_at).getTime()) / 60000);
  return `${lock.locked_by}@${lock.hostname} (PID ${lock.pid}), locked ${age} min ago`;
}
