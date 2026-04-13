#!/usr/bin/env node
// bin/portwatch-threshold.js — manage port count thresholds

const {
  loadThresholds,
  setThreshold,
  removeThreshold,
  checkThresholds
} = require('../src/portwatch-threshold');
const { scanPorts } = require('./portwatch');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log(`
Usage: portwatch-threshold <command> [options]

Commands:
  list                        List all thresholds
  set <name> [--max N] [--min N] [--process <name>]
                              Define a threshold
  remove <name>               Remove a threshold
  check                       Run check against current ports

Examples:
  portwatch-threshold set web --max 10
  portwatch-threshold set node-procs --max 5 --process node
  portwatch-threshold check
`);
}

function parseOpts(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--max') opts.maxPorts = parseInt(args[++i], 10);
    else if (args[i] === '--min') opts.minPorts = parseInt(args[++i], 10);
    else if (args[i] === '--process') opts.process = args[++i];
  }
  return opts;
}

async function run() {
  if (!cmd || cmd === '--help') return usage();

  if (cmd === 'list') {
    const thresholds = loadThresholds();
    const entries = Object.values(thresholds);
    if (!entries.length) return console.log('No thresholds defined.');
    for (const t of entries) {
      const parts = [`[${t.name}]`];
      if (t.maxPorts !== null) parts.push(`max:${t.maxPorts}`);
      if (t.minPorts !== null) parts.push(`min:${t.minPorts}`);
      if (t.process) parts.push(`process:${t.process}`);
      console.log(parts.join('  '));
    }
    return;
  }

  if (cmd === 'set') {
    const name = args[0];
    if (!name) return console.error('Error: threshold name required');
    const opts = parseOpts(args.slice(1));
    setThreshold(name, opts);
    console.log(`Threshold '${name}' saved.`);
    return;
  }

  if (cmd === 'remove') {
    const name = args[0];
    if (!name) return console.error('Error: threshold name required');
    const ok = removeThreshold(name);
    console.log(ok ? `Removed '${name}'.` : `Threshold '${name}' not found.`);
    return;
  }

  if (cmd === 'check') {
    const entries = await scanPorts();
    const { checkThresholds, formatViolation } = require('../src/portwatch-threshold');
    const violations = checkThresholds(entries);
    if (!violations.length) {
      console.log('All thresholds OK.');
    } else {
      violations.forEach(v => console.warn(formatViolation(v)));
      process.exitCode = 1;
    }
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
