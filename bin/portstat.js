#!/usr/bin/env node
'use strict';

const { scanPorts } = require('./portwatch');
const { enrichWithStats, summarizeStats } = require('../src/portstat');
const { applyFilters } = require('../src/filter');
const { loadConfig } = require('../src/config');

const args = process.argv.slice(2);
const showSummary = args.includes('--summary');
const showJson = args.includes('--json');

async function run() {
  const config = loadConfig();

  let entries;
  try {
    entries = await scanPorts();
  } catch (err) {
    console.error('Failed to scan ports:', err.message);
    process.exit(1);
  }

  const filtered = applyFilters(entries, {
    range: config.portRange || null,
    protocol: config.protocol || null,
    process: null
  });

  const enriched = enrichWithStats(filtered);

  if (showSummary) {
    const summary = summarizeStats(enriched);
    if (showJson) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`\nPort Stats Summary`);
      console.log(`------------------`);
      console.log(`Total ports   : ${summary.totalPorts}`);
      console.log(`Total conns   : ${summary.totalConnections}`);
      console.log(`Busiest port  : ${summary.busiestPort ?? 'n/a'}`);
      console.log(`Busiest proc  : ${summary.busiestProcess ?? 'n/a'}`);
      console.log(`Generated at  : ${summary.generatedAt}`);
    }
    return;
  }

  if (showJson) {
    console.log(JSON.stringify(enriched, null, 2));
    return;
  }

  console.log(`\n${'PORT'.padEnd(8)}${'PROTO'.padEnd(8)}${'PROCESS'.padEnd(20)}CONNECTIONS`);
  console.log('-'.repeat(48));
  for (const entry of enriched) {
    const s = entry.stat;
    console.log(
      `${String(s.port).padEnd(8)}${s.protocol.padEnd(8)}${s.process.padEnd(20)}${s.connections}`
    );
  }
}

run();
