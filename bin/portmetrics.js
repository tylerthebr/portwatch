#!/usr/bin/env node
// bin/portmetrics.js — CLI for viewing port usage metrics

const { loadHistory } = require('../src/history');
const { buildMetricsReport } = require('../src/portmetrics');

const args = process.argv.slice(2);
const flag = args[0];

function usage() {
  console.log('Usage: portmetrics [--transient | --uptime | --top <n>]');
  console.log('  --transient     List ports seen only once');
  console.log('  --uptime        Show uptime ratios for all ports');
  console.log('  --top <n>       Show top N ports by occurrence (default: 10)');
}

function run() {
  const history = loadHistory();

  if (history.length === 0) {
    console.log('No history found. Run portwatch first to collect data.');
    process.exit(0);
  }

  const report = buildMetricsReport(history);

  if (flag === '--transient') {
    console.log(`\nTransient ports (appeared once across ${report.totalSnapshots} snapshots):`);
    if (report.transientPorts.length === 0) {
      console.log('  None found.');
    } else {
      report.transientPorts.forEach(p => console.log(`  ${p}`));
    }
    return;
  }

  if (flag === '--uptime') {
    console.log(`\nUptime ratios (${report.totalSnapshots} snapshots):`);
    const sorted = Object.entries(report.uptimeRatios).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([key, ratio]) => {
      const pct = (ratio * 100).toFixed(1);
      console.log(`  ${key.padEnd(20)} ${pct}%`);
    });
    return;
  }

  if (flag === '--top') {
    const n = parseInt(args[1], 10) || 10;
    console.log(`\nTop ${n} ports by occurrence:`);
    const sorted = Object.entries(report.occurrences).sort((a, b) => b[1] - a[1]).slice(0, n);
    sorted.forEach(([key, count]) => {
      console.log(`  ${key.padEnd(20)} ${count} appearances`);
    });
    return;
  }

  if (flag === '--help' || flag === '-h') {
    usage();
    return;
  }

  // Default: summary
  console.log(`\nPort Metrics Summary`);
  console.log(`  Snapshots analyzed : ${report.totalSnapshots}`);
  console.log(`  Unique ports seen  : ${report.uniquePorts}`);
  console.log(`  Transient ports    : ${report.transientPorts.length}`);
  console.log(`  Generated at       : ${report.generatedAt}`);
}

run();
