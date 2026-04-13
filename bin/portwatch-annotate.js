#!/usr/bin/env node
// bin/portwatch-annotate.js — CLI to display annotated port list

const { scanPorts } = require('./portwatch');
const { annotateEntries, formatAnnotation, hasAnnotation } = require('../src/portwatch-annotate');
const { applyFilters } = require('../src/filter');

const args = process.argv.slice(2);

function usage() {
  console.log('Usage: portwatch-annotate [--only-annotated] [--protocol tcp|udp]');
  console.log('');
  console.log('Options:');
  console.log('  --only-annotated   Only show ports that have at least one annotation');
  console.log('  --protocol <p>     Filter by protocol (tcp or udp)');
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) usage();

const onlyAnnotated = args.includes('--only-annotated');
const protocolIdx = args.indexOf('--protocol');
const protocol = protocolIdx !== -1 ? args[protocolIdx + 1] : null;

async function run() {
  let entries;
  try {
    entries = await scanPorts();
  } catch (err) {
    console.error('Failed to scan ports:', err.message);
    process.exit(1);
  }

  if (protocol) {
    entries = applyFilters(entries, { protocol });
  }

  const annotated = annotateEntries(entries);
  const filtered = onlyAnnotated ? annotated.filter(hasAnnotation) : annotated;

  if (filtered.length === 0) {
    console.log('No ports found.');
    return;
  }

  console.log(`${'PORT'.padEnd(8)}${'PID'.padEnd(8)}${'PROCESS'.padEnd(18)}ANNOTATIONS`);
  console.log('-'.repeat(64));
  for (const entry of filtered) {
    const note = formatAnnotation(entry.annotation);
    const port = String(entry.port).padEnd(8);
    const pid = String(entry.pid || '-').padEnd(8);
    const proc = (entry.process || '-').slice(0, 16).padEnd(18);
    console.log(`${port}${pid}${proc}${note || '—'}`);
  }
}

run();
