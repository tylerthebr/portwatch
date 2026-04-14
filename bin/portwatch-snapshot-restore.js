#!/usr/bin/env node
'use strict';

const { loadHistory } = require('../src/history');
const {
  findSnapshotByIndex,
  findSnapshotByTimestamp,
  loadRestoreLog,
  restoreSnapshot,
  formatRestoreResult
} = require('../src/portwatch-snapshot-restore');

function usage() {
  console.log([
    'Usage: portwatch-snapshot-restore <command> [options]',
    '',
    'Commands:',
    '  restore <index|timestamp>  Restore snapshot by index or timestamp prefix',
    '  log                        Show restore history',
    '',
    'Options:',
    '  --label <name>             Label for this restore (default: restored)',
    '  --dry                      Dry run, do not write'
  ].join('\n'));
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (cmd === 'log') {
  const log = loadRestoreLog();
  if (!log.length) {
    console.log('No restores recorded.');
  } else {
    log.forEach((e, i) => {
      console.log(`[${i}] ${e.restoredAt} — from ${e.from} (${e.label})`);
  process.exit(0);
}

if (cmd === 'restore') {
  const ref = args[1];
  if (!ref) {
    console.error('Error: provide an index or timestamp');
    process.exit(1);
  }

  const labelIdx = args.indexOf('--label');
  const label = labelIdx !== -1 ? args[labelIdx + 1] : 'restored';
  const dry = args.includes('--dry');

  const history = loadHistory();
  const entry = /^-?\d+$/.test(ref)
    ? findSnapshotByIndex(history, parseInt(ref, 10))
    : findSnapshotByTimestamp(history, ref);

  if (!entry) {
    console.error(`No snapshot found for ref: ${ref}`);
    process.exit(1);
  }

  try {
    const result = restoreSnapshot(entry, { label, dry });
    console.log(formatRestoreResult(result));
  } catch (err) {
    console.error('Restore failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
usage();
process.exit(1);
