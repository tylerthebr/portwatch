#!/usr/bin/env node
// bin/portwatch-status.js — CLI entry for `portwatch status`

const { buildStatus, formatStatus } = require('../src/portwatch-status');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const helpMode = args.includes('--help') || args.includes('-h');

function usage() {
  console.log([
    'Usage: portwatch status [options]',
    '',
    'Show the current runtime status of portwatch components.',
    '',
    'Options:',
    '  --json    Output status as JSON',
    '  --help    Show this help message',
  ].join('\n'));
}

async function run() {
  if (helpMode) {
    usage();
    process.exit(0);
  }

  let status;
  try {
    status = await buildStatus();
  } catch (err) {
    console.error('Failed to build status:', err.message);
    process.exit(1);
  }

  if (jsonMode) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(formatStatus(status));
  }
}

run();
