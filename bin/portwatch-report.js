#!/usr/bin/env node
'use strict';

const { buildReport, formatReport } = require('../src/portwatch-report');

function usage() {
  console.log('usage: portwatch-report [--limit <n>] [--since <date>] [--json]');
  console.log('');
  console.log('options:');
  console.log('  --limit <n>      number of history entries to include (default: 10)');
  console.log('  --since <date>   only include entries after this date (ISO format)');
  console.log('  --json           output raw JSON instead of formatted text');
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const limitIdx = args.indexOf('--limit');
const sinceIdx = args.indexOf('--since');
const jsonMode = args.includes('--json');

const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10;
const since = sinceIdx !== -1 ? args[sinceIdx + 1] : null;

if (limitIdx !== -1 && isNaN(limit)) {
  console.error('error: --limit must be a number');
  process.exit(1);
}

try {
  const report = buildReport({ limit, since });

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
  }
} catch (err) {
  console.error('error generating report:', err.message);
  process.exit(1);
}
