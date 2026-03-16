import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { resolveProjectId, getProjectDir } from '../project.js';
import { readJournal } from '../journal.js';
import { header, keyValue, line } from '../display.js';

/** Maps stage numbers to their canonical deliverable filenames (mirrors run.js) */
const STAGE_FILE_NAMES = {
  0: 'STAGE_00_Project_Charter.md',
  1: 'STAGE_01_Project_Initialization.md',
  2: 'STAGE_02_Current_State_Analysis.md',
  3: 'STAGE_03_Problem_Domain_Analysis.md',
  4: 'STAGE_04_Solution_Requirements.md',
  5: 'STAGE_05_Future_State_Design.md',
  6: 'STAGE_06_Gap_Analysis_Roadmap.md',
  7: 'STAGE_07_Risk_Assessment.md',
  8: 'STAGE_08_Business_Case_ROI.md',
};

// ──────────────────────────────────────────────
//  LCS-based line diff
// ──────────────────────────────────────────────

/**
 * Compute a line-level diff between arrays `a` (old) and `b` (new) using LCS.
 * Returns an array of { type: 'eq'|'add'|'del', val: string }.
 */
function computeDiff(a, b) {
  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'eq', val: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', val: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'del', val: a[i - 1] });
      i--;
    }
  }
  return result;
}

/**
 * Print a context-aware diff (like `diff -U N`).
 * Returns { added, removed, unchanged }.
 */
function renderContextDiff(diff, contextLines = 3) {
  const n = diff.length;
  // Mark which lines should be shown (within contextLines of any change)
  const show = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (diff[i].type !== 'eq') {
      const lo = Math.max(0, i - contextLines);
      const hi = Math.min(n - 1, i + contextLines);
      for (let k = lo; k <= hi; k++) show[k] = 1;
    }
  }

  const stats = { added: 0, removed: 0, unchanged: 0 };
  let lastShown = -2;

  for (let i = 0; i < n; i++) {
    const { type, val } = diff[i];
    if (!show[i]) { stats.unchanged++; continue; }
    if (lastShown >= 0 && i > lastShown + 1) {
      console.log(chalk.cyan('  @@ ... @@'));
    }
    if (type === 'add') { stats.added++; console.log(chalk.green('+ ' + val)); }
    else if (type === 'del') { stats.removed++; console.log(chalk.red('- ' + val)); }
    else { console.log(chalk.dim('  ' + val)); }
    lastShown = i;
  }
  return stats;
}

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function resolveDeliverableFile(projectId, stageNum) {
  const projectDir = getProjectDir(projectId);
  const canonical = path.join(projectDir, STAGE_FILE_NAMES[stageNum]);
  if (fs.existsSync(canonical)) return canonical;

  // Fallback: check journal.deliverable_file
  try {
    const journal = readJournal(projectId);
    const stageEntry = journal.stages.find(s => s.stage === stageNum);
    if (stageEntry?.deliverable_file) {
      const fromJournal = path.isAbsolute(stageEntry.deliverable_file)
        ? stageEntry.deliverable_file
        : path.join(projectDir, stageEntry.deliverable_file);
      if (fs.existsSync(fromJournal)) return fromJournal;
    }
  } catch (_) { /* ignore */ }

  return null;
}

function printStageSummary(journal, stageNum) {
  const stages = stageNum !== undefined
    ? journal.stages.filter(s => s.stage === stageNum)
    : journal.stages;

  for (const s of stages) {
    const icon = { not_started: '⏸️ ', in_progress: '🔄', approved: '✅', rejected: '❌', completed: '✅' }[s.status] || '  ';
    console.log(`\n  ${icon}  ${chalk.bold(`Stage ${s.stage}`)}: ${s.name}`);
    keyValue('Status:', chalk.bold(s.status.toUpperCase()));
    if (s.started_at)   keyValue('Started:', s.started_at.slice(0, 19).replace('T', ' '));
    if (s.completed_at) keyValue('Completed:', s.completed_at.slice(0, 19).replace('T', ' '));
    if (s.approved_at)  keyValue('Approved:', s.approved_at.slice(0, 19).replace('T', ' '));
    if (s.notes)        keyValue('Notes:', chalk.yellow(s.notes));
    if (s.deliverable_file) keyValue('Deliverable:', s.deliverable_file);
  }
}

// ──────────────────────────────────────────────
//  Main command
// ──────────────────────────────────────────────

export async function diffCommand(id1, id2, options) {
  const stageOpt   = options.stage !== undefined ? parseInt(options.stage, 10) : undefined;
  const contextOpt = parseInt(options.context ?? '3', 10);

  // ── Single-project mode: show journal history ──────────────────────────────
  if (!id2) {
    const projectId = resolveProjectId(id1);
    if (!projectId) {
      console.error(chalk.red(`Error: Project not found: ${id1}`));
      process.exit(1);
    }

    const journal = readJournal(projectId);
    header(`Stage History: ${projectId}`);
    keyValue('Project:', journal.project_name);
    keyValue('Current stage:', String(journal.current_stage));
    keyValue('Status:', journal.current_status);

    if (stageOpt !== undefined) {
      if (isNaN(stageOpt) || stageOpt < 0 || stageOpt > 8) {
        console.error(chalk.red('Error: --stage must be between 0 and 8'));
        process.exit(1);
      }
      printStageSummary(journal, stageOpt);

      // Show deliverable file preview (first 30 lines)
      const filePath = resolveDeliverableFile(projectId, stageOpt);
      if (filePath) {
        console.log('');
        console.log(chalk.bold(`  📄 Deliverable: ${path.basename(filePath)}`));
        console.log(chalk.dim('  ' + line()));
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const preview = lines.slice(0, 30);
        for (const l of preview) console.log(chalk.dim('  ') + l);
        if (lines.length > 30) {
          console.log(chalk.dim(`  ... (${lines.length - 30} more lines — use your editor to view full file)`));
        }
      } else {
        console.log('');
        console.log(chalk.dim(`  No deliverable file found for Stage ${stageOpt}.`));
        console.log(chalk.dim(`  Run 'babok run' or generate a deliverable first.`));
      }
    } else {
      printStageSummary(journal, undefined);
    }

    console.log('');
    return;
  }

  // ── Two-project mode: file diff ────────────────────────────────────────────
  const pid1 = resolveProjectId(id1);
  const pid2 = resolveProjectId(id2);

  if (!pid1) { console.error(chalk.red(`Error: Project not found: ${id1}`)); process.exit(1); }
  if (!pid2) { console.error(chalk.red(`Error: Project not found: ${id2}`)); process.exit(1); }
  if (pid1 === pid2) { console.error(chalk.red('Error: Both IDs resolve to the same project.')); process.exit(1); }

  const targetStages = stageOpt !== undefined
    ? [stageOpt]
    : [1, 2, 3, 4, 5, 6, 7, 8];  // default: diff all stages

  let totalAdded = 0, totalRemoved = 0;

  header(`Diff: ${pid1} ← → ${pid2}`);

  for (const sn of targetStages) {
    const f1 = resolveDeliverableFile(pid1, sn);
    const f2 = resolveDeliverableFile(pid2, sn);

    if (!f1 && !f2) continue;  // stage doesn't exist in either project — skip silently

    const stageName = STAGE_FILE_NAMES[sn] ?? `Stage ${sn}`;
    console.log('');
    console.log(chalk.bold.cyan(`  Stage ${sn}: ${stageName}`));
    console.log(chalk.dim('  ' + line()));

    if (!f1) { console.log(chalk.yellow(`  ← only in ${pid2} (not present in ${pid1})`)); continue; }
    if (!f2) { console.log(chalk.yellow(`  → only in ${pid1} (not present in ${pid2})`)); continue; }

    const a = fs.readFileSync(f1, 'utf-8').split('\n');
    const b = fs.readFileSync(f2, 'utf-8').split('\n');

    if (a.join('\n') === b.join('\n')) {
      console.log(chalk.green('  ✓ identical'));
      continue;
    }

    const diff = computeDiff(a, b);
    const stats = renderContextDiff(diff, contextOpt);
    totalAdded   += stats.added;
    totalRemoved += stats.removed;
    console.log('');
    console.log(chalk.dim(`  ${chalk.green('+' + stats.added)} ${chalk.red('-' + stats.removed)} lines changed`));
  }

  console.log('');
  console.log(chalk.dim(line()));
  keyValue(chalk.green('Total added:'),   String(totalAdded));
  keyValue(chalk.red('Total removed:'), String(totalRemoved));
  console.log('');
}
