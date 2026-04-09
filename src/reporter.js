const chalk = require('chalk');

function printDiff(diff) {
  if (!diff || (diff.added.length === 0 && diff.removed.length === 0)) {
    console.log(chalk.gray('No port changes detected.'));
    return;
  }

  if (diff.added.length > 0) {
    console.log(chalk.green(`\n+${diff.added.length} new port(s) opened:`));
    diff.added.forEach((entry) => {
      console.log(chalk.green(`  + ${entry.port}\t${entry.process || 'unknown'}\t(pid: ${entry.pid || 'n/a'})`));
    });
  }

  if (diff.removed.length > 0) {
    console.log(chalk.red(`\n-${diff.removed.length} port(s) closed:`));
    diff.removed.forEach((entry) => {
      console.log(chalk.red(`  - ${entry.port}\t${entry.process || 'unknown'}\t(pid: ${entry.pid || 'n/a'})`));
    });
  }
}

function printPortList(ports) {
  if (!ports || ports.length === 0) {
    console.log(chalk.gray('No active ports found.'));
    return;
  }
  console.log(chalk.bold(`\nActive ports (${ports.length}):`) );
  ports.forEach((entry) => {
    console.log(`  ${chalk.cyan(entry.port)}\t${entry.process || 'unknown'}\t(pid: ${entry.pid || 'n/a'})`);
  });
}

function printHistory(entries) {
  if (!entries || entries.length === 0) {
    console.log(chalk.gray('No history recorded yet.'));
    return;
  }
  console.log(chalk.bold(`\nPort change history (${entries.length} entries):`));
  entries.forEach((entry) => {
    const date = new Date(entry.timestamp).toLocaleString();
    console.log(chalk.dim(`  [${date}]`));
    entry.added.forEach((p) => console.log(chalk.green(`    + ${p.port} ${p.process || ''}`.trimEnd())));
    entry.removed.forEach((p) => console.log(chalk.red(`    - ${p.port} ${p.process || ''}`.trimEnd())));
  });
}

module.exports = { printDiff, printPortList, printHistory };
