#!/usr/bin/env node
'use strict';

const {
  rebuildIndex,
  loadIndex,
  findByLabel,
  findByTag,
  findByDate,
} = require('../src/portwatch-snapshot-index');

function usage() {
  console.log(`
Usage: portwatch-snapshot-index <command> [options]

Commands:
  build                   Rebuild the snapshot index from history
  list                    List all indexed snapshots
  find --label <label>    Find snapshots by label
  find --tag <tag>        Find snapshots by tag
  find --date <YYYY-MM>   Find snapshots by date prefix
`);
}

const [,, cmd, ...args] = process.argv;

function printEntries(entries) {
  if (!entries.length) {
    console.log('No matching snapshots.');
    return;
  }
  entries.forEach(e => {
    const parts = [`#${e.index}`, e.timestamp, `${e.portCount} ports`];
    if (e.label) parts.push(`label=${e.label}`);
    if (e.tag) parts.push(`tag=${e.tag}`);
    console.log(parts.join('  '));
  });
}

if (cmd === 'build') {
  const index = rebuildIndex();
  console.log(`Index rebuilt: ${index.length} snapshot(s) indexed.`);
} else if (cmd === 'list') {
  printEntries(loadIndex());
} else if (cmd === 'find') {
  const flagIdx = args.indexOf('--label');
  const tagIdx = args.indexOf('--tag');
  const dateIdx = args.indexOf('--date');
  if (flagIdx !== -1) {
    printEntries(findByLabel(args[flagIdx + 1]));
  } else if (tagIdx !== -1) {
    printEntries(findByTag(args[tagIdx + 1]));
  } else if (dateIdx !== -1) {
    printEntries(findByDate(args[dateIdx + 1]));
  } else {
    console.error('Specify --label, --tag, or --date');
    process.exit(1);
  }
} else {
  usage();
}
