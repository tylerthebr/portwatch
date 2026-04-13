#!/usr/bin/env node
// bin/portwatch-snapshot-tag.js
// CLI for managing snapshot tags

const {
  tagSnapshot,
  untagSnapshot,
  getSnapshotIdByTag,
  listSnapshotTags,
  clearSnapshotTags
} = require('../src/portwatch-snapshot-tag');

function usage() {
  console.log(`
Usage: portwatch-snapshot-tag <command> [args]

Commands:
  set <tag> <snapshotId>   Tag a snapshot with a name
  get <tag>                Look up snapshot ID by tag
  remove <tag>             Remove a tag
  list                     List all tags
  clear                    Remove all tags
`);
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'set': {
    const [tag, snapshotId] = args;
    if (!tag || !snapshotId) {
      console.error('Usage: portwatch-snapshot-tag set <tag> <snapshotId>');
      process.exit(1);
    }
    const result = tagSnapshot(tag, snapshotId);
    console.log(`Tagged "${tag}" → ${result.snapshotId} (at ${result.taggedAt})`);
    break;
  }
  case 'get': {
    const [tag] = args;
    if (!tag) { console.error('tag required'); process.exit(1); }
    const id = getSnapshotIdByTag(tag);
    if (!id) { console.log(`No snapshot tagged "${tag}"`); }
    else { console.log(`${tag} → ${id}`); }
    break;
  }
  case 'remove': {
    const [tag] = args;
    if (!tag) { console.error('tag required'); process.exit(1); }
    const ok = untagSnapshot(tag);
    console.log(ok ? `Removed tag "${tag}"` : `Tag "${tag}" not found`);
    break;
  }
  case 'list': {
    const tags = listSnapshotTags();
    const entries = Object.entries(tags);
    if (!entries.length) { console.log('No snapshot tags defined.'); break; }
    entries.forEach(([tag, { snapshotId, taggedAt }]) => {
      console.log(`  ${tag.padEnd(20)} ${snapshotId}  (${taggedAt})`);
    });
    break;
  }
  case 'clear': {
    clearSnapshotTags();
    console.log('All snapshot tags cleared.');
    break;
  }
  default:
    usage();
    if (cmd) process.exit(1);
}
