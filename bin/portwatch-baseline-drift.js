#!/usr/bin/env node
// bin/portwatch-baseline-drift.js
// CLI: compare current ports against a saved baseline

const { scanPorts } = require('./portwatch');
const { buildBaselineDriftReport, formatBaselineDriftReport } = require('../src/portwatch-baseline-drift');
const { parsePortOutput } = require('../src/scanner');
const { execSync } = require('child_process');

function usage() {
  console.log('Usage: portwatch-baseline-drift [--baseline <name>] [--json]');
  console.log('');
  console.log('Options:');
  console.log('  --baseline <name>   Baseline name to compare against (default: "default")');
  console.log('  --json              Output raw JSON report');
  process.exit(0);
}

async function run() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) usage();

  const baselineIdx = args.indexOf('--baseline');
  const baselineName = baselineIdx !== -1 ? args[baselineIdx + 1] : 'default';
  const jsonMode = args.includes('--json');

  let raw;
  try {
    raw = execSync('ss -tlnup 2>/dev/null || netstat -tlnup 2>/dev/null', { encoding: 'utf8' });
  } catch {
    console.error('Failed to scan ports.');
    process.exit(1);
  }

  const current = parsePortOutput(raw);
  const report = buildBaselineDriftReport(current, baselineName);

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatBaselineDriftReport(report));
  }

  if (report.level === 'high') process.exit(2);
  if (report.level === 'moderate') process.exit(1);
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
