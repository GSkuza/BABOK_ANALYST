/**
 * `babok score <id> <stage|all>` — run the quality scorer and print a colour-coded
 * score card to stdout.
 */

import chalk from 'chalk';
import { resolveProjectId } from '../project.js';
import { scoreStage, scoreAll } from '../quality/scorer.js';
import { line } from '../display.js';

function statusColour(score) {
  if (score >= 85) return chalk.bold.green;
  if (score >= 75) return chalk.bold.yellow;
  return chalk.bold.red;
}

function bar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

function printScoreCard(report) {
  const { stage, scores, passed, issues, timestamp } = report;

  console.log('');
  const passLabel = passed ? chalk.bold.green('✅ PASSED') : chalk.bold.red('❌ FAILED');
  console.log(`  ${chalk.bold.cyan(`Stage ${stage} Score Report`)}  ${passLabel}`);
  console.log(chalk.dim(`  ${timestamp.slice(0, 19).replace('T', ' ')} UTC`));
  console.log(chalk.dim(`  ${line('─', 52)}`));

  const rows = [
    ['Completeness (40%)', scores.completeness],
    ['Consistency  (30%)', scores.consistency],
    ['Quality/SMART(30%)', scores.quality],
  ];

  for (const [label, score] of rows) {
    const colour = statusColour(score);
    console.log(
      `  ${chalk.gray(label.padEnd(20))} ${bar(score)}  ${colour(String(score).padStart(3))}%`
    );
  }

  console.log(chalk.dim(`  ${line('─', 52)}`));
  const overallColour = statusColour(scores.overall);
  console.log(
    `  ${'Overall Score'.padEnd(20)} ${bar(scores.overall)}  ${overallColour(String(scores.overall).padStart(5))}`
  );
  console.log('');

  if (issues.length === 0) {
    console.log(chalk.green('  ✓ No issues found'));
  } else {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      console.log(chalk.bold.red(`  ✗ Errors (${errors.length}):`));
      for (const issue of errors) {
        console.log(`    ${chalk.red('●')} [${issue.ruleId}] ${issue.message}`);
        console.log(`      ${chalk.dim('→ ' + issue.remediation)}`);
      }
    }
    if (warnings.length > 0) {
      console.log(chalk.bold.yellow(`  ⚠ Warnings (${warnings.length}):`));
      for (const issue of warnings) {
        console.log(`    ${chalk.yellow('●')} [${issue.ruleId}] ${issue.message}`);
        console.log(`      ${chalk.dim('→ ' + issue.remediation)}`);
      }
    }
    if (infos.length > 0) {
      console.log(chalk.bold.dim(`  ℹ Info (${infos.length}):`));
      for (const issue of infos) {
        console.log(`    ${chalk.dim('●')} [${issue.ruleId}] ${issue.message}`);
      }
    }
  }
  console.log('');
}

function printSummary(reports) {
  const passed = reports.filter(r => r.passed).length;
  const total = reports.length;
  const avgOverall =
    total > 0
      ? Math.round((reports.reduce((s, r) => s + r.scores.overall, 0) / total) * 10) / 10
      : 0;

  console.log('');
  console.log(chalk.bold.cyan('  ═══ Overall Project Score Summary ═══'));
  console.log(chalk.dim(`  ${line('─', 52)}`));
  console.log(
    `  Stages scored: ${chalk.bold(total)} | Passed: ${chalk.bold.green(passed)} | Failed: ${chalk.bold.red(total - passed)}`
  );
  console.log(`  Average overall score: ${statusColour(avgOverall)(String(avgOverall) + '%')}`);
  console.log('');
}

export async function scoreCommand(partialId, stageArg, _options) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(`Error: Project not found: ${partialId}`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold.cyan(`BABOK Quality Scorer — Project: ${projectId}`));
  console.log(chalk.dim(line('━', 56)));

  try {
    if (stageArg === 'all') {
      const reports = await scoreAll(projectId);
      if (reports.length === 0) {
        console.log(chalk.yellow('  No stage deliverables found to score.'));
        process.exit(0);
      }
      for (const report of reports) {
        printScoreCard(report);
      }
      printSummary(reports);
    } else {
      const stageNumber = parseInt(stageArg, 10);
      if (isNaN(stageNumber) || stageNumber < 1 || stageNumber > 8) {
        console.error(chalk.red('Error: Stage must be a number 1–8 or "all"'));
        process.exit(1);
      }
      const report = await scoreStage(projectId, stageNumber);
      printScoreCard(report);
    }
  } catch (err) {
    console.error(chalk.red(`\nError: ${err.message}`));
    process.exit(1);
  }
}
