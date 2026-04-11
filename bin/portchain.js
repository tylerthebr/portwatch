#!/usr/bin/env node
// bin/portchain.js — run the default portchain pipeline and print results

const { scanPorts } = require('./portwatch');
const { processEntries } = require('../src/portchain');
const { printPortList } = require('../src/reporter');
const { loadConfig } = require('../src/config');

const args = process.argv.slice(2);
const flags = new Set(args);

function usage() {
  console.log([
    'Usage: portchain [options]',
    '',
    'Options:',
    '  --filter     apply active filter config',
    '  --resolve    resolve process names',
    '  --label      annotate with well-known port labels',
    '  --stats      enrich with connection stats',
    '  --strict     abort pipeline on any step error',
    '  --help       show this help',
  ].join('\n'));
}

if (flags.has('--help')) {
  usage();
  process.exit(0);
}

// Warn about any unrecognized flags so users catch typos early
const KNOWN_FLAGS = new Set(['--filter', '--resolve', '--label', '--stats', '--strict', '--help']);
for (const flag of flags) {
  if (!KNOWN_FLAGS.has(flag)) {
    console.warn(`Warning: unrecognized option "${flag}" (ignored)`);
  }
}

async function main() {
  const config = loadConfig();

  const raw = await scanPorts();

  const opts = {
    filter: flags.has('--filter') ? config.filter : null,
    resolve: flags.has('--resolve'),
    label: flags.has('--label'),
    stats: flags.has('--stats'),
    strict: flags.has('--strict'),
  };

  let entries;
  try {
    entries = await processEntries(raw, opts);
  } catch (err) {
    console.error('Pipeline error:', err.message);
    process.exit(1);
  }

  if (!entries.length) {
    console.log('No ports matched.');
    return;
  }

  printPortList(entries);
  console.log(`\n${entries.length} port(s) listed.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
