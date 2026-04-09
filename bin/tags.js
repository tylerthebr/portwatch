#!/usr/bin/env node
// bin/tags.js — CLI interface for managing port tags

const { setTag, removeTag, getTags, clearTags } = require('../src/tags');

const [,, command, ...args] = process.argv;

function usage() {
  console.log('Usage:');
  console.log('  portwatch tags set <port> <tag>');
  console.log('  portwatch tags remove <port>');
  console.log('  portwatch tags list');
  console.log('  portwatch tags clear');
}

switch (command) {
  case 'set': {
    const port = parseInt(args[0], 10);
    const tag = args[1];
    if (!port || !tag) {
      console.error('Usage: portwatch tags set <port> <tag>');
      process.exit(1);
    }
    try {
      setTag(port, tag);
      console.log(`Tagged port ${port} as "${tag}"`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    break;
  }

  case 'remove': {
    const port = parseInt(args[0], 10);
    if (!port) {
      console.error('Usage: portwatch tags remove <port>');
      process.exit(1);
    }
    const removed = removeTag(port);
    if (removed) {
      console.log(`Removed tag for port ${port}`);
    } else {
      console.log(`No tag found for port ${port}`);
    }
    break;
  }

  case 'list': {
    const tags = getTags();
    const entries = Object.entries(tags);
    if (entries.length === 0) {
      console.log('No tags set.');
    } else {
      console.log('Port tags:');
      entries.forEach(([port, tag]) => console.log(`  ${port}  →  ${tag}`));
    }
    break;
  }

  case 'clear': {
    clearTags();
    console.log('All tags cleared.');
    break;
  }

  default:
    usage();
    process.exit(1);
}
