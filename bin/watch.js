#!/usr/bin/env node
'use strict';

const { startWatcher, stopWatcher, onWatcherChange, watcherStatus } = require('../src/watcher');
const { scanPorts } = require('./portwatch');
const { loadConfig } = require('../src/config');
const { printPortList } = require('../src/reporter');

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const config = await loadConfig();

  if (command === 'stop') {
    // In a real daemon scenario this would signal the process;
    // here we just report status since we're stateless between invocations.
    console.log('[portwatch] Use Ctrl+C to stop a running watch session.');
    process.exit(0);
  }

  if (command === 'status') {
    const { running } = watcherStatus();
    console.log(`[portwatch] Watcher is ${running ? 'running' : 'not running'}.`);
    process.exit(0);
  }

  const interval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1], 10)
    || config.interval
    || 5000;

  console.log('[portwatch] Watch mode started. Press Ctrl+C to stop.\n');

  onWatcherChange((diff) => {
    const total = diff.added.length + diff.removed.length;
    console.log(`[portwatch] ${total} change(s) detected at ${new Date().toLocaleTimeString()}`);
  });

  await startWatcher(scanPorts, { interval });

  process.on('SIGINT', () => {
    console.log('\n[portwatch] Shutting down watcher...');
    stopWatcher();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[portwatch] Fatal error:', err.message);
  process.exit(1);
});
