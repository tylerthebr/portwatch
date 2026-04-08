#!/usr/bin/env node

import chalk from 'chalk';
import { scanPorts } from '../src/scanner.js';

async function main() {
  console.log(chalk.cyan.bold('\n🔍 portwatch — scanning open ports...\n'));

  let ports;
  try {
    ports = await scanPorts();
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }

  if (ports.length === 0) {
    console.log(chalk.yellow('No open ports detected.'));
    return;
  }

  const header = `${'PORT'.padEnd(8)}${'PROTO'.padEnd(8)}${'STATE'.padEnd(12)}PID`;
  console.log(chalk.gray(header));
  console.log(chalk.gray('─'.repeat(40)));

  for (const { port, protocol, state, pid } of ports) {
    const portStr = chalk.green(String(port).padEnd(8));
    const protoStr = chalk.blue(protocol.padEnd(8));
    const stateStr = chalk.yellow(state.padEnd(12));
    const pidStr = pid ? chalk.magenta(pid) : chalk.gray('—');
    console.log(`${portStr}${protoStr}${stateStr}${pidStr}`);
  }

  console.log(chalk.gray(`\n${ports.length} port(s) found.\n`));
}

main();
