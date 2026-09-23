import chalk from 'chalk';
import { createProduct, readProduct, listProductIds, createBaseline, readBaseline, listBaselineIds, updateProductRepositories } from '../software-development/product-store.js';
import { buildBaseline } from '../software-development/baseline-builder.js';
import { createGithubConnector } from '../software-development/hosting/github.js';
import { createGitlabConnector } from '../software-development/hosting/gitlab.js';
import { setExecutionAuthorization, readExecutionAuthorization } from '../software-development/runtime/execution-authorization.js';
import { runCommand as runAuthorizedCommand } from '../software-development/runtime/code-executor.js';

/** Parse a repeatable "--repo host:owner:name[:role]" flag into a RepositoryRef. */
function parseRepoFlag(value, previous = []) {
  const parts = value.split(':');
  if (parts.length < 3) {
    console.error(chalk.red(`Error: --repo must be "host:owner:name[:role]", got "${value}"`));
    process.exit(1);
  }
  const [host, owner, name, role] = parts;
  previous.push({ id: `${owner}/${name}`, host, owner, name, ...(role ? { role } : {}) });
  return previous;
}

export function createProductCommand(options) {
  if (!options.name) {
    console.error(chalk.red('Error: --name is required'));
    process.exit(1);
  }
  const product = createProduct({ name: options.name, repositories: options.repo ?? [] });
  console.log(chalk.green('✓ Product created'));
  console.log(chalk.cyan('  Product ID: ') + chalk.bold(product.product_id));
  console.log(chalk.cyan('  Name:       ') + product.name);
  console.log(chalk.cyan('  Repositories:'));
  for (const repo of product.repositories) {
    console.log(`    - ${repo.id} (${repo.host}: ${repo.owner}/${repo.name}${repo.role ? `, ${repo.role}` : ''})`);
  }
}

export function listProductsCommand() {
  const ids = listProductIds();
  if (ids.length === 0) {
    console.log(chalk.dim('No products yet. Create one with: babok sd product create --name "..." --repo github:owner:name'));
    return;
  }
  for (const id of ids) {
    const product = readProduct(id);
    console.log(`${chalk.bold(id)} — ${product.name} (${product.repositories.length} repositor${product.repositories.length === 1 ? 'y' : 'ies'})`);
  }
}

export function showProductCommand(productId) {
  const product = readProduct(productId);
  console.log(JSON.stringify(product, null, 2));
  const baselineIds = listBaselineIds(productId);
  console.log(chalk.cyan(`\nBaselines (${baselineIds.length}): `) + (baselineIds.length ? baselineIds.join(', ') : chalk.dim('none yet')));
}

export function addRepositoryCommand(productId, repoFlagValue) {
  const product = readProduct(productId);
  const repos = parseRepoFlag(repoFlagValue, [...product.repositories]);
  const updated = updateProductRepositories(productId, repos);
  console.log(chalk.green('✓ Repository list updated'));
  console.log(JSON.stringify(updated.repositories, null, 2));
}

function connectorsForRepositories(repositories) {
  const hosts = new Set(repositories.map(r => r.host));
  const connectors = {};
  if (hosts.has('github')) connectors.github = createGithubConnector();
  if (hosts.has('gitlab')) connectors.gitlab = createGitlabConnector();
  return connectors;
}

export async function buildBaselineCommand(productId) {
  const product = readProduct(productId);
  if (product.repositories.length === 0) {
    console.error(chalk.red(`Error: product "${productId}" has no repositories. Add one first: babok sd product add-repo ${productId} --repo host:owner:name`));
    process.exit(1);
  }
  console.log(chalk.cyan(`Building baseline for ${productId} (${product.repositories.length} repositor${product.repositories.length === 1 ? 'y' : 'ies'})...`));
  try {
    const connectors = connectorsForRepositories(product.repositories);
    const result = await buildBaseline({ productId, repositories: product.repositories, connectors });
    console.log(chalk.green('✓ Baseline built'));
    console.log(chalk.cyan('  Baseline ID: ') + chalk.bold(result.baseline.baseline_id));
    console.log(chalk.cyan('  Evidence entries: ') + result.baseline.evidence.length);
    for (const { repository_id, analysis } of result.analyses) {
      console.log(`    - ${repository_id}: ${analysis.fileCount} files, ${analysis.manifests.length} manifest(s), CI: ${analysis.ciConfigPaths.length > 0 ? 'yes' : 'no'}, tests: ${analysis.testDirectories.length > 0 ? analysis.testDirectories.join(',') : 'not detected'}`);
    }
    if (!result.narrative) {
      console.log(chalk.dim('  (No LLM configured — this baseline is mechanical evidence only. Configure a provider to add narrative synthesis.)'));
    }
  } catch (err) {
    console.error(chalk.red(`\nError building baseline: ${err.message}`));
    process.exit(1);
  }
}

export function listBaselinesCommand(productId) {
  const ids = listBaselineIds(productId);
  if (ids.length === 0) {
    console.log(chalk.dim('No baselines yet.'));
    return;
  }
  for (const id of ids) {
    const baseline = readBaseline(productId, id);
    console.log(`${chalk.bold(id)} — ${baseline.created_at} — ${baseline.evidence?.length ?? 0} evidence entries`);
  }
}

export function showBaselineCommand(productId, baselineId) {
  console.log(JSON.stringify(readBaseline(productId, baselineId), null, 2));
}

export function authorizeExecCommand(initiativeId, options) {
  if (options.revoke) {
    setExecutionAuthorization(initiativeId, options.scope, { granted: false, grantedBy: options.by });
    console.log(chalk.yellow(`Execution authorisation "${options.scope}" revoked for ${initiativeId}.`));
    return;
  }
  if (!options.by) {
    console.error(chalk.red('Error: --by "Your Name" is required to record who authorised this'));
    process.exit(1);
  }
  const constraints = {};
  if (options.commands) constraints.allowedCommands = options.commands.split(',').map(s => s.trim());
  if (options.dirs) constraints.allowedDirectories = options.dirs.split(',').map(s => s.trim());
  setExecutionAuthorization(initiativeId, options.scope, { granted: true, grantedBy: options.by, constraints });
  console.log(chalk.green(`✓ Execution authorisation "${options.scope}" granted for ${initiativeId}`));
  console.log(chalk.dim(`  Allowed commands: ${constraints.allowedCommands?.join(', ') ?? '(none — every command will be refused)'}`));
  console.log(chalk.dim(`  Allowed directories: ${constraints.allowedDirectories?.join(', ') ?? '(any)'}`));
}

export function showExecAuthCommand(initiativeId, scope) {
  const record = readExecutionAuthorization(initiativeId, scope);
  console.log(record ? JSON.stringify(record, null, 2) : chalk.dim(`No "${scope}" authorisation recorded for ${initiativeId}.`));
}

export async function runExecCommand(initiativeId, options, command, args) {
  try {
    const result = await runAuthorizedCommand(initiativeId, { cwd: options.cwd, command, args: args ?? [] });
    console.log(chalk.cyan(`Exit code: `) + (result.exitCode === 0 ? chalk.green(result.exitCode) : chalk.red(result.exitCode)));
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(chalk.dim(result.stderr));
    if (result.exitCode !== 0) process.exitCode = 1;
  } catch (err) {
    console.error(chalk.red(`\nError: ${err.message}`));
    process.exit(1);
  }
}

export { parseRepoFlag };
