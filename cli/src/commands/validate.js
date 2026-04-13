/**
 * `babok validate <id>` — run cross-stage consistency validation and print
 * a colour-coded report. Exits with code 1 if any errors are found.
 */

import chalk from 'chalk';
import { resolveProjectId } from '../project.js';
import { validateProject } from '../validation/cross-stage-validator.js';
import { line } from '../display.js';

const SEVERITY_COLOUR = {
  error: chalk.bold.red,
  warning: chalk.bold.yellow,
  info: chalk.dim,
};

const SEVERITY_ICON = {
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

function printFinding(finding) {
  const colour = SEVERITY_COLOUR[finding.severity] || chalk.white;
  const icon = SEVERITY_ICON[finding.severity] || '·';
  const stages = finding.stagesInvolved.length > 0
    ? chalk.dim(` [Stage${finding.stagesInvolved.length > 1 ? 's' : ''} ${finding.stagesInvolved.join(', ')}]`)
    : '';

  console.log(`  ${colour(icon)} ${chalk.bold(`[${finding.ruleId}]`)}${stages}`);
  console.log(`    ${finding.message}`);
  if (finding.remediation) {
    console.log(`    ${chalk.dim('→ ' + finding.remediation)}`);
  }
}

export async function validateCommand(partialId, _options) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(`Error: Project not found: ${partialId}`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold.cyan(`BABOK Cross-Stage Validator — Project: ${projectId}`));
  console.log(chalk.dim(line('━', 60)));

  let report;
  try {
    report = await validateProject(projectId);
  } catch (err) {
    console.error(chalk.red(`\nValidation failed: ${err.message}`));
    process.exit(1);
  }

  const { rulesRun, passed, failed, warnings, findings } = report;

  console.log('');
  console.log(`  Rules run:  ${chalk.bold(rulesRun)}`);
  console.log(`  Passed:     ${chalk.bold.green(passed)}`);
  console.log(`  Errors:     ${failed > 0 ? chalk.bold.red(failed) : chalk.green('0')}`);
  console.log(`  Warnings:   ${warnings > 0 ? chalk.bold.yellow(warnings) : chalk.green('0')}`);
  console.log('');
  console.log(chalk.dim(line('─', 60)));

  if (findings.length === 0) {
    console.log('');
    console.log(chalk.bold.green('  ✅ All cross-stage consistency checks passed!'));
    console.log('');
    return;
  }

  // Group findings by severity
  const errors = findings.filter(f => f.severity === 'error');
  const warningFindings = findings.filter(f => f.severity === 'warning');
  const infoFindings = findings.filter(f => f.severity === 'info');

  if (errors.length > 0) {
    console.log('');
    console.log(chalk.bold.red(`  ERRORS (${errors.length}):`));
    for (const f of errors) printFinding(f);
  }

  if (warningFindings.length > 0) {
    console.log('');
    console.log(chalk.bold.yellow(`  WARNINGS (${warningFindings.length}):`));
    for (const f of warningFindings) printFinding(f);
  }

  if (infoFindings.length > 0) {
    console.log('');
    console.log(chalk.dim(`  INFO (${infoFindings.length}):`));
    for (const f of infoFindings) printFinding(f);
  }

  console.log('');
  console.log(chalk.dim(line('─', 60)));

  const overallStatus = failed > 0
    ? chalk.bold.red('❌ VALIDATION FAILED')
    : chalk.bold.yellow('⚠ VALIDATION PASSED WITH WARNINGS');
  console.log(`  ${overallStatus}`);
  console.log('');

  if (failed > 0) process.exit(1);
}
