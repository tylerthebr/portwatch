#!/usr/bin/env node
// bin/portwatch-rollup.js — CLI for port rollup summary

const { buildRollupFromHistory, formatRollup } = require('../src/portwatch-rollup');

function usage() {
  console.log('Usage: portwatch-rollup [--window <hours>] [--json]');
  console.log('');
  console.log('Options:');
  console.log('  --window <hours>   Time window in hours (default: 24)');
  console.log('  --json             Output raw JSON');
  console.log('  --help             Show this help');
}

const args = process.argv.slice(2);

if (args.includes('--help')) {
  usage();
  process.exit(0);
}

const windowIdx = args.indexOf('--window');
const windowHrs = windowIdx !== -1 ? parseFloat(args[windowIdx + 1]) : 24;

if (isNaN(windowHrs) || windowHrs <= 0) {
  console.error('Error: --window must be a positive number');
  process.exit(1);
}

const windowMs = windowHrs * 3600 * 1000;
const asJson = args.includes('--json');

try {
  const rollup = buildRollupFromHistory(windowMs);
  if (asJson) {
    console.log(JSON.stringify(rollup, null, 2));
  } else {
    console.log(formatRollup(rollup));
  }
} catch (err) {
  console.error('Failed to build rollup:', err.message);
  process.exit(1);
}
