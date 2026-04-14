#!/usr/bin/env node
// bin/portwatch-scorecard.js — CLI for port health scorecard

const { buildScorecard, formatScorecard } = require('../src/portwatch-scorecard');
const { loadHistory } = require('../src/history');

const args = process.argv.slice(2);

function usage() {
  console.log([
    'Usage: portwatch-scorecard [options]',
    '',
    'Options:',
    '  --json          Output raw JSON',
    '  --stale <ms>    Stale threshold in ms (default: 3600000)',
    '  --help          Show this help',
  ].join('\n'));
}

if (args.includes('--help')) {
  usage();
  process.exit(0);
}

const jsonMode = args.includes('--json');
const staleIdx = args.indexOf('--stale');
const staleThresholdMs = staleIdx !== -1 ? parseInt(args[staleIdx + 1], 10) : 3600000;

async function run() {
  let history;
  try {
    history = loadHistory();
  } catch (err) {
    console.error('Failed to load history:', err.message);
    process.exit(1);
  }

  if (!history || history.length === 0) {
    console.error('No history found. Run a scan first.');
    process.exit(1);
  }

  const scorecard = buildScorecard(history, { staleThresholdMs });

  if (jsonMode) {
    console.log(JSON.stringify(scorecard, null, 2));
  } else {
    console.log(formatScorecard(scorecard));
  }
}

run();
