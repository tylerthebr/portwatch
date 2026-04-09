#!/usr/bin/env node
'use strict';

const {
  loadWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  clearWatchlist
} = require('../src/watchlist');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log('Usage: portwatch watchlist <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  list              Show all watched ports');
  console.log('  add <port> [label]  Add a port to the watchlist');
  console.log('  remove <port>     Remove a port from the watchlist');
  console.log('  clear             Remove all watched ports');
}

if (!cmd || cmd === 'list') {
  const list = loadWatchlist();
  if (list.length === 0) {
    console.log('No ports on watchlist.');
  } else {
    console.log(`Watched ports (${list.length}):`);
    list.forEach(e => {
      const label = e.label ? ` — ${e.label}` : '';
      console.log(`  :${e.port}${label}  (added ${e.addedAt})`);
    });
  }
} else if (cmd === 'add') {
  const port = Number(args[0]);
  if (!port || isNaN(port)) {
    console.error('Error: please provide a valid port number.');
    process.exit(1);
  }
  const label = args.slice(1).join(' ');
  const added = addToWatchlist(port, label);
  if (added) {
    console.log(`Port ${port} added to watchlist.`);
  } else {
    console.log(`Port ${port} is already on the watchlist.`);
  }
} else if (cmd === 'remove') {
  const port = Number(args[0]);
  if (!port || isNaN(port)) {
    console.error('Error: please provide a valid port number.');
    process.exit(1);
  }
  const removed = removeFromWatchlist(port);
  if (removed) {
    console.log(`Port ${port} removed from watchlist.`);
  } else {
    console.log(`Port ${port} was not on the watchlist.`);
  }
} else if (cmd === 'clear') {
  clearWatchlist();
  console.log('Watchlist cleared.');
} else {
  usage();
  process.exit(1);
}
