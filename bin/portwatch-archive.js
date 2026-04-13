#!/usr/bin/env node
'use strict';

const {
  archiveHistory,
  loadArchive,
  getArchiveById,
  removeArchive,
  clearArchive,
  formatArchiveList
} = require('../src/portwatch-archive');

function usage() {
  console.log([
    'Usage: portwatch-archive <command> [options]',
    '',
    'Commands:',
    '  save [label]       Archive current history with an optional label',
    '  list               List all archived snapshots',
    '  show <id>          Show entries in a specific archive',
    '  remove <id>        Delete an archive by ID',
    '  clear              Remove all archives',
  ].join('\n'));
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'save': {
    const label = args.join(' ') || undefined;
    const entry = archiveHistory(label);
    if (!entry) {
      console.log('Nothing to archive — history is empty.');
    } else {
      console.log(`Archived as [${entry.id}]: ${entry.label} (${entry.entryCount} entries)`);
    }
    break;
  }
  case 'list': {
    const archive = loadArchive();
    console.log(formatArchiveList(archive));
    break;
  }
  case 'show': {
    const id = args[0];
    if (!id) { console.error('Provide an archive ID.'); process.exit(1); }
    const entry = getArchiveById(id);
    if (!entry) { console.error(`No archive found with id: ${id}`); process.exit(1); }
    console.log(`Archive: ${entry.label} (${entry.createdAt})`);
    entry.snapshot.forEach(e => {
      console.log(`  :${e.port}  ${e.process || 'unknown'}  [${e.protocol || 'tcp'}]`);
    });
    break;
  }
  case 'remove': {
    const id = args[0];
    if (!id) { console.error('Provide an archive ID.'); process.exit(1); }
    removeArchive(id);
    console.log(`Removed archive: ${id}`);
    break;
  }
  case 'clear': {
    clearArchive();
    console.log('All archives cleared.');
    break;
  }
  default:
    usage();
}
