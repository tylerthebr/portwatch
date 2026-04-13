#!/usr/bin/env node
// bin/portwatch-badge.js — CLI for generating portwatch status badges

const {
  getStatusBadge,
  getPortCountBadge,
  getStaleBadge,
  formatBadgeJSON,
  formatBadgeSVG
} = require('../src/portwatch-badge');
const { loadSnapshot } = require('../src/snapshot');

const args = process.argv.slice(2);
const cmd = args[0];
const format = args.includes('--svg') ? 'svg' : 'json';

function usage() {
  console.log(`Usage: portwatch-badge <command> [--svg]

Commands:
  status       Daemon running status badge
  ports        Active port count badge
  stale        Stale port count badge

Options:
  --svg        Output SVG instead of JSON
`);
}

function render(badge) {
  if (format === 'svg') {
    console.log(formatBadgeSVG(badge));
  } else {
    console.log(formatBadgeJSON(badge));
  }
}

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

const snapshot = loadSnapshot();

switch (cmd) {
  case 'status':
    render(getStatusBadge());
    break;
  case 'ports':
    render(getPortCountBadge(snapshot));
    break;
  case 'stale': {
    const maxAge = args.includes('--max-age')
      ? parseInt(args[args.indexOf('--max-age') + 1], 10)
      : 3600000;
    render(getStaleBadge(snapshot, maxAge));
    break;
  }
  default:
    console.error(`Unknown command: ${cmd}`);
    usage();
    process.exit(1);
}
