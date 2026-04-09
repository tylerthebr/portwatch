const chalk = require('chalk');

/**
 * Print a human-readable diff report to stdout
 * @param {{ added: Object[], removed: Object[] }} diff
 * @param {Object} [options]
 * @param {boolean} [options.quiet] - suppress output when no changes
 */
function printDiff(diff, options = {}) {
  const { added, removed } = diff;
  const hasChanges = added.length > 0 || removed.length > 0;

  if (!hasChanges) {
    if (!options.quiet) {
      console.log(chalk.gray('No port changes detected.'));
    }
    return;
  }

  if (removed.length > 0) {
    console.log(chalk.yellow(`\n  ${removed.length} port(s) closed:`));
    for (const p of removed) {
      console.log(
        chalk.red(`  - :${p.port} (${p.protocol}) — ${p.process || 'unknown'} [pid ${p.pid}]`)
      );
    }
  }

  if (added.length > 0) {
    console.log(chalk.yellow(`\n  ${added.length} new port(s) open:`));
    for (const p of added) {
      console.log(
        chalk.green(`  + :${p.port} (${p.protocol}) — ${p.process || 'unknown'} [pid ${p.pid}]`)
      );
    }
  }

  console.log('');
}

/**
 * Print a full list of currently open ports
 * @param {Object[]} ports
 */
function printPortList(ports) {
  if (ports.length === 0) {
    console.log(chalk.gray('No open ports found.'));
    return;
  }
  console.log(chalk.bold(`\n  Open ports (${ports.length}):`))
  for (const p of ports) {
    console.log(
      chalk.cyan(`  :${p.port}`) +
      chalk.gray(` (${p.protocol}) — ${p.process || 'unknown'} [pid ${p.pid}]`)
    );
  }
  console.log('');
}

module.exports = { printDiff, printPortList };
