// portwatch.js — coordinates a full scan cycle with diffing, alerting, and reporting

const { scanPorts } = require('../bin/portwatch');
const { loadSnapshot, saveSnapshot, diffSnapshots } = require('./snapshot');
const { printDiff, printPortList } = require('./reporter');
const { notifyOnChanges } = require('./notifier');
const { appendHistoryEntry } = require('./history');
const { applyFilters } = require('./filter');
const { loadConfig } = require('./config');
const { runAllPluginHooks } = require('./plugin');
const { emitEvent } = require('./portevents');

/**
 * Run a single watch cycle: scan, diff, alert, persist.
 * @param {object} options - overrides for config
 * @returns {Promise<{ ports: object[], diff: object|null }>}
 */
async function runCycle(options = {}) {
  const config = { ...(await loadConfig()), ...options };

  const raw = await scanPorts();
  const filtered = applyFilters(raw, config.filters || {});

  const previous = await loadSnapshot();
  const diff = previous ? diffSnapshots(previous, filtered) : null;

  await saveSnapshot(filtered);

  if (diff) {
    const hasChanges =
      diff.added.length > 0 ||
      diff.removed.length > 0 ||
      diff.changed.length > 0;

    if (hasChanges) {
      printDiff(diff);
      await notifyOnChanges(diff, config);
      await appendHistoryEntry({ timestamp: Date.now(), diff });
      emitEvent('cycle:changed', { diff, ports: filtered });
    } else {
      emitEvent('cycle:unchanged', { ports: filtered });
    }
  } else {
    printPortList(filtered);
    emitEvent('cycle:initial', { ports: filtered });
  }

  await runAllPluginHooks('afterCycle', { ports: filtered, diff });

  return { ports: filtered, diff };
}

module.exports = { runCycle };
