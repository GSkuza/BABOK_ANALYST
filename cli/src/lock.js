/**
 * File locking module for BABOK Agent CLI
 * Prevents concurrent stage edits when multiple team members share a project directory.
 *
 * Lock file: <projectDir>/.stage_N.lock
 * Format:    { locked_by, hostname, pid, locked_at }
 *
 * Staleness: locks older than STALE_MINUTES are considered stale and auto-released.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getProjectDir } from './project.js';

const STALE_MINUTES = 120; // 2 hours

function lockFilePath(projectId, stageNumber, dir) {
  return path.join(dir || getProjectDir(projectId), `.stage_${stageNumber}.lock`);
}

/**
 * Read lock metadata (or null if not locked / stale).
 * @param {string} projectId
 * @param {number} stageNumber
 * @param {string} [dir] - Optional override for the project directory
 */
export function checkLock(projectId, stageNumber, dir) {
  const lockPath = lockFilePath(projectId, stageNumber, dir);
  if (!fs.existsSync(lockPath)) return null;

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return null; // corrupt file → treat as unlocked
  }

  // Check staleness
  const ageMs = Date.now() - new Date(lock.locked_at).getTime();
  if (ageMs > STALE_MINUTES * 60 * 1000) {
    // Silently remove stale lock
    try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
    return null;
  }

  return lock;
}

/**
 * Try to acquire a lock for (projectId, stageNumber).
 * Returns { acquired: true } on success.
 * Returns { acquired: false, lock } when already locked by someone else.
 * @param {string} projectId
 * @param {number} stageNumber
 * @param {string} [dir] - Optional override for the project directory
 */
export function acquireLock(projectId, stageNumber, dir) {
  const existing = checkLock(projectId, stageNumber, dir);
  if (existing) {
    // Allow re-entry from same process
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
    // wx flag = fail if file already exists (atomic on most FS)
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), { flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') {
      // Race condition — someone grabbed it between checkLock and writeFile
      const concurrent = checkLock(projectId, stageNumber, dir);
      return { acquired: false, lock: concurrent };
    }
    throw err;
  }

  return { acquired: true };
}

/**
 * Release a lock previously acquired by this process.
 * No-op if lock does not exist or belongs to a different process.
 * @param {string} projectId
 * @param {number} stageNumber
 * @param {string} [dir] - Optional override for the project directory
 */
export function releaseLock(projectId, stageNumber, dir) {
  const lockPath = lockFilePath(projectId, stageNumber, dir);
  if (!fs.existsSync(lockPath)) return;

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return;
  }

  // Only release if this process owns the lock
  if (lock.pid === process.pid && lock.hostname === os.hostname()) {
    try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
  }
}

/**
 * Format a human-readable lock description for error messages.
 */
export function formatLockInfo(lock) {
  if (!lock) return '(unknown)';
  const age = Math.round((Date.now() - new Date(lock.locked_at).getTime()) / 60000);
  return `${lock.locked_by}@${lock.hostname} (PID ${lock.pid}), locked ${age} min ago`;
}
