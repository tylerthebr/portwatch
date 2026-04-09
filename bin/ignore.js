#!/usr/bin/env node
'use strict';

const {
  loadIgnoreList,
  addIgnoredPort,
  removeIgnoredPort,
  addIgnoredProcess,
  removeIgnoredProcess,
  clearIgnoreList,
} = require('../src/ignore');

const [,, cmd, type, value] = process.argv;

function usage() {
  console.log(`
portwatch ignore <command>

Commands:
  list                        Show current ignore list
  add port <port>             Ignore a specific port
  add process <name>          Ignore a specific process name
  remove port <port>          Stop ignoring a port
  remove process <name>       Stop ignoring a process name
  clear                       Clear all ignore rules
`);
}

if (!cmd || === 'help') {
  usage();
  process.exit(0);
}

if (cmd === 'list') {
  const list = loadIgnoreList();
  console.log('Ignored ports:', list.ports.length ? list.ports.join(', ') : '(none)');
  console.log('Ignored processes:', list.processes.length ? list.processes.join(', ') : '(none)');
  process.exit(0);
}

if (cmd === 'clear') {
  clearIgnoreList();
  console.log('Ignore list cleared.');
  process.exit(0);
}

if (cmd === 'add' && type === 'port' && value) {
  addIgnoredPort(value);
  console.log(`Port ${value} added to ignore list.`);
  process.exit(0);
}

if (cmd === 'add' && type === 'process' && value) {
  addIgnoredProcess(value);
  console.log(`Process "${value}" added to ignore list.`);
  process.exit(0);
}

if (cmd === 'remove' && type === 'port' && value) {
  removeIgnoredPort(value);
  console.log(`Port ${value} removed from ignore list.`);
  process.exit(0);
}

if (cmd === 'remove' && type === 'process' && value) {
  removeIgnoredProcess(value);
  console.log(`Process "${value}" removed from ignore list.`);
  process.exit(0);
}

console.error('Unknown command. Run `portwatch ignore help` for usage.');
process.exit(1);
