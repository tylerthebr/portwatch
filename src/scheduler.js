const { scanPorts } = require('../bin/portwatch');
const { loadSnapshot, saveSnapshot, diffSnapshots } = require('./snapshot');
const { notifyOnChanges } = require('./notifier');
const { printDiff } = require('./reporter');
const { loadConfig } = require('./config');
const { appendHistoryEntry } = require('./history');

let intervalHandle = null;

async function runScan(label = 'scheduled') {
  const config = loadConfig();
  const ports = await scanPorts();
  const previous = loadSnapshot();
  const diff = diffSnapshots(previous, ports);

  if (diff.added.length > 0 || diff.removed.length > 0) {
    printDiff(diff);
    await notifyOnChanges(diff, config);
    appendHistoryEntry({ label, diff, timestamp: new Date().toISOString() });
  }

  saveSnapshot(ports);
  return diff;
}

function startScheduler(intervalMs) {
  if (intervalHandle) {
    console.warn('[portwatch] Scheduler already running.');
    return;
  }

  console.log(`[portwatch] Watching ports every ${intervalMs / 1000}s...`);
  intervalHandle = setInterval(async () => {
    try {
      await runScan();
    } catch (err) {
      console.error('[portwatch] Scan error:', err.message);
    }
  }, intervalMs);

  // Allow process to exit cleanly on SIGINT
  process.on('SIGINT', () => {
    stopScheduler();
    console.log('\n[portwatch] Stopped.');
    process.exit(0);
  });
}

function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

function isRunning() {
  return intervalHandle !== null;
}

module.exports = { startScheduler, stopScheduler, runScan, isRunning };
