#!/usr/bin/env node
// bin/portwatch-pin.js — CLI for managing pinned ports

const {
  pinPort, unpinPort, listPins, clearPins, isPinned,
} = require('../src/portwatch-pin');

function usage() {
  console.log([
    'Usage: portwatch pin <command> [options]',
    '',
    'Commands:',
    '  add <port> [label]   Pin a port',
    '  remove <port>        Unpin a port',
    '  list                 List all pinned ports',
    '  clear                Remove all pins',
    '  check <port>         Check if a port is pinned',
  ].join('\n'));
}

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (cmd === 'add') {
  const port = parseInt(args[0], 10);
  if (!port) { console.error('Port required'); process.exit(1); }
  const label = args.slice(1).join(' ');
  const entry = pinPort(port, label);
  console.log(`Pinned port ${entry.port}${entry.label ? ` (${entry.label})` : ''}`);

} else if (cmd === 'remove') {
  const port = parseInt(args[0], 10);
  if (!port) { console.error('Port required'); process.exit(1); }
  const ok = unpinPort(port);
  console.log(ok ? `Unpinned port ${port}` : `Port ${port} was not pinned`);

} else if (cmd === 'list') {
  const pins = listPins();
  if (!pins.length) { console.log('No pinned ports.'); process.exit(0); }
  pins.forEach(p => {
    const lbl = p.label ? `  ${p.label}` : '';
    console.log(`  :${p.port}${lbl}  (pinned ${p.pinnedAt})`);
  });

} else if (cmd === 'clear') {
  clearPins();
  console.log('All pins cleared.');

} else if (cmd === 'check') {
  const port = parseInt(args[0], 10);
  if (!port) { console.error('Port required'); process.exit(1); }
  console.log(isPinned(port) ? `Port ${port} is pinned` : `Port ${port} is not pinned`);

} else {
  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}
