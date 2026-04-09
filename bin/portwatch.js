#!/usr/bin/env node
const { program } = require('commander');
const { parsePortOutput } = require('../src/scanner');
const { saveSnapshot, loadSnapshot, diffSnapshots } = require('../src/snapshot');
const { printDiff, printPortList, printHistory } = require('../src/reporter');
const { appendHistoryEntry, getRecentHistory, clearHistory } = require('../src/history');
const { notifyOnChanges } = require('../src/notifier');
const { execSync } = require('child_process');

function scanPorts() {
  try {
    const output = execSync('lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null || ss -tlnp 2>/dev/null', { encoding: 'utf8' });
    return parsePortOutput(output);
  } catch {
    return [];
  }
}

program.name('portwatch').description('Monitor and alert on port usage changes').version('1.0.0');

program.command('scan').description('Scan current ports and show active listeners').action(() => {
  const ports = scanPorts();
  printPortList(ports);
});

program.command('watch').description('Compare current ports to last snapshot and report changes').action(async () => {
  const current = scanPorts();
  const previous = loadSnapshot();
  if (!previous) {
    console.log('No previous snapshot found. Run `portwatch snapshot` first.');
    saveSnapshot(current);
    return;
  }
  const diff = diffSnapshots(previous, current);
  printDiff(diff);
  appendHistoryEntry(diff);
  await notifyOnChanges(diff);
  saveSnapshot(current);
});

program.command('snapshot').description('Save current port state as baseline snapshot').action(() => {
  const ports = scanPorts();
  saveSnapshot(ports);
  console.log(`Snapshot saved with ${ports.length} active port(s).`);
});

program.command('history').description('Show recent port change history').option('-n, --limit <number>', 'number of entries to show', '10').action((opts) => {
  const entries = getRecentHistory(parseInt(opts.limit, 10));
  printHistory(entries);
});

program.command('history:clear').description('Clear all saved history').action(() => {
  clearHistory();
  console.log('History cleared.');
});

program.parse(process.argv);
