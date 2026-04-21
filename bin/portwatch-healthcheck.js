#!/usr/bin/env node
'use strict';

const { checkWatchlist, runHealthCheck, buildHealthReport, formatHealthReport } =
  require('../src/portwatch-healthcheck');
const { loadWatchlist } = require('../src/watchlist');

const args = process.argv.slice(2);

function usage() {
  console.log([
    'Usage: portwatch-healthcheck [options]',
    '',
    'Options:',
    '  --port <n>   Check a single port instead of the watchlist',
    '  --json       Output raw JSON',
    '  --help       Show this help'
  ].join('\n'));
}

if (args.includes('--help')) {
  usage();
  process.exit(0);
}

async function run() {
  let results;

  const portIdx = args.indexOf('--port');
  if (portIdx !== -1) {
    const port = parseInt(args[portIdx + 1], 10);
    if (isNaN(port)) {
      console.error('Invalid port number');
      process.exit(1);
    }
    results = await runHealthCheck([{ port }]);
  } else {
    const watchlist = loadWatchlist();
    if (watchlist.length === 0) {
      console.log('Watchlist is empty. Add ports with: portwatch watchlist add <port>');
      process.exit(0);
    }
    results = await checkWatchlist();
  }

  const report = buildHealthReport(results);

  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatHealthReport(report));
  }

  process.exit(report.unreachable > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
