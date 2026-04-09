const { startScheduler, stopScheduler, isRunning } = require('./scheduler');
const { saveSnapshot, loadSnapshot, diffSnapshots } = require('./snapshot');
const { appendHistoryEntry } = require('./history');
const { notifyOnChanges } = require('./notifier');
const { printDiff } = require('./reporter');
const { loadConfig } = require('./config');

let _onChangeCb = null;
let _snapshotLabel = 'watcher';

async function startWatcher(scanFn, options = {}) {
  const config = await loadConfig();
  const interval = options.interval || config.interval || 5000;
  const label = options.label || _snapshotLabel;

  if (isRunning()) {
    console.warn('[portwatch] Watcher is already running.');
    return;
  }

  console.log(`[portwatch] Starting watcher (interval: ${interval}ms)`);

  startScheduler(async () => {
    const previous = await loadSnapshot(label);
    const current = await scanFn();

    await saveSnapshot(label, current);

    if (!previous) return;

    const diff = diffSnapshots(previous, current);
    const hasChanges = diff.added.length > 0 || diff.removed.length > 0;

    if (hasChanges) {
      await appendHistoryEntry({ diff, timestamp: Date.now() });
      await notifyOnChanges(diff);
      printDiff(diff);

      if (typeof _onChangeCb === 'function') {
        _onChangeCb(diff);
      }
    }
  }, interval);
}

function stopWatcher() {
  if (!isRunning()) {
    console.warn('[portwatch] Watcher is not running.');
    return;
  }
  stopScheduler();
  console.log('[portwatch] Watcher stopped.');
}

function onWatcherChange(cb) {
  _onChangeCb = cb;
}

function watcherStatus() {
  return { running: isRunning() };
}

module.exports = { startWatcher, stopWatcher, onWatcherChange, watcherStatus };
