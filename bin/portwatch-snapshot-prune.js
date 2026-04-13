#!/usr/bin/env node
'use strict';

const { loadHistory, saveHistory } = require('../src/history');
const {
  pruneHistory,
  buildPruneReport,
  formatPruneReport,
} = require('../src/portwatch-snapshot-prune');

function usage() {
  console.log(`
Usage: portwatch snapshot-prune [options]

Options:
  --max-age <days>    Remove entries older than N days (default: 30)
  --max-count <n>     Keep at most N entries (default: 100)
  --dry-run           Preview changes without saving
  --help              Show this help
`.trim());
}

function parseOpts(argv) {
  const opts = { maxAgeDays: 30, maxCount: 100, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') { usage(); process.exit(0); }
    if (argv[i] === '--dry-run') opts.dryRun = true;
    if (argv[i] === '--max-age' && argv[i + 1]) opts.maxAgeDays = parseInt(argv[++i], 10);
    if (argv[i] === '--max-count' && argv[i + 1]) opts.maxCount = parseInt(argv[++i], 10);
  }
  return opts;
}

function run() {
  const opts = parseOpts(process.argv.slice(2));
  const history = loadHistory();

  if (!history.length) {
    console.log('No history entries found.');
    return;
  }

  const pruned = pruneHistory(history, opts);
  const report = buildPruneReport(history, pruned);

  console.log(formatPruneReport(report));

  if (opts.dryRun) {
    console.log('\n(dry run — no changes saved)');
    return;
  }

  if (report.removed > 0) {
    saveHistory(pruned);
    console.log('History updated.');
  } else {
    console.log('Nothing to prune.');
  }
}

run();
