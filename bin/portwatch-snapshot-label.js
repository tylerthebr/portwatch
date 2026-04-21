#!/usr/bin/env node
'use strict';

const {
  setSnapshotLabel,
  getSnapshotLabel,
  removeSnapshotLabel,
  listSnapshotLabels,
  formatLabelEntry
} = require('../src/portwatch-snapshot-label');

function usage() {
  console.log(`
Usage: portwatch-snapshot-label <command> [options]

Commands:
  set <snapshotId> <label>   Assign a label to a snapshot
  get <snapshotId>           Show label for a snapshot
  remove <snapshotId>        Remove label from a snapshot
  list                       List all labeled snapshots

Examples:
  portwatch-snapshot-label set 2024-06-01T10:00:00Z pre-release
  portwatch-snapshot-label get 2024-06-01T10:00:00Z
  portwatch-snapshot-label list
  portwatch-snapshot-label remove 2024-06-01T10:00:00Z
  `);
}

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (cmd === 'set') {
  const [snapshotId, label] = args;
  if (!snapshotId || !label) {
    console.error('Error: snapshotId and label are required');
    process.exit(1);
  }
  const entry = setSnapshotLabel(snapshotId, label);
  console.log(`Labeled "${snapshotId}" as "${label}" (${entry.createdAt})`);

} else if (cmd === 'get') {
  const [snapshotId] = args;
  if (!snapshotId) { console.error('Error: snapshotId required'); process.exit(1); }
  const entry = getSnapshotLabel(snapshotId);
  if (!entry) { console.log(`No label set for "${snapshotId}"`); }
  else { console.log(formatLabelEntry(snapshotId, entry)); }

} else if (cmd === 'remove') {
  const [snapshotId] = args;
  if (!snapshotId) { console.error('Error: snapshotId required'); process.exit(1); }
  const removed = removeSnapshotLabel(snapshotId);
  console.log(removed ? `Removed label for "${snapshotId}"` : `No label found for "${snapshotId}"`);

} else if (cmd === 'list') {
  const labels = listSnapshotLabels();
  const entries = Object.entries(labels);
  if (entries.length === 0) {
    console.log('No snapshot labels set.');
  } else {
    entries.forEach(([id, entry]) => console.log(formatLabelEntry(id, entry)));
  }

} else {
  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}
