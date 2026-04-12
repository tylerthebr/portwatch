#!/usr/bin/env node
// bin/portquery.js — CLI for querying port entries

const { scanPorts } = require('./portwatch');
const { buildPortMap } = require('../src/portmap');
const { queryPorts, lookupPort } = require('../src/portquery');
const { formatPortEntry } = require('../src/formatter');

const args = process.argv.slice(2);

function usage() {
  console.log('Usage:');
  console.log('  portwatch query "<expr>"     Query active ports');
  console.log('  portwatch query --port <n>  Look up a specific port');
  console.log('');
  console.log('Expression tokens (space-separated):');
  console.log('  port=<n>        Exact port number');
  console.log('  proto=<tcp|udp> Protocol');
  console.log('  process=<name>  Process name');
  console.log('  range=<lo>-<hi> Port range');
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  usage();
}

async function main() {
  let entries;
  try {
    const { parsePortOutput } = require('../src/scanner');
    const raw = await require('../bin/portwatch').scanPorts();
    entries = parsePortOutput(raw);
  } catch {
    console.error('Failed to scan ports.');
    process.exit(1);
  }

  if (args[0] === '--port') {
    const port = parseInt(args[1], 10);
    if (isNaN(port)) {
      console.error('Invalid port number.');
      process.exit(1);
    }
    const portMap = buildPortMap(entries);
    const entry = lookupPort(portMap, port);
    if (!entry) {
      console.log(`No active entry found for port ${port}.`);
    } else {
      console.log(formatPortEntry(entry));
    }
    return;
  }

  const queryStr = args.join(' ');
  const results = queryPorts(entries, queryStr);

  if (results.length === 0) {
    console.log('No matching ports found.');
    return;
  }

  console.log(`Found ${results.length} matching port(s):`);
  for (const entry of results) {
    console.log(' ', formatPortEntry(entry));
  }
}

main();
