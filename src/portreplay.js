// portreplay.js — replay historical port snapshots for debugging/analysis

const { loadHistory } = require('./history');
const { printPortList, printDiff } = require('./reporter');
const { diffSnapshots } = require('./snapshot');

/**
 * Get a snapshot entry from history by index (0 = most recent)
 */
function getSnapshotAt(history, index) {
  if (!history || history.length === 0) return null;
  const normalized = index < 0 ? history.length + index : index;
  return history[normalized] || null;
}

/**
 * Replay a single snapshot from history by index
 */
function replaySnapshot(index = 0) {
  const history = loadHistory();
  const entry = getSnapshotAt(history, index);
  if (!entry) {
    console.error(`No snapshot found at index ${index}`);
    return null;
  }
  return entry;
}

/**
 * Replay a diff between two history entries by index
 */
function replayDiff(fromIndex, toIndex) {
  const history = loadHistory();
  const from = getSnapshotAt(history, fromIndex);
  const to = getSnapshotAt(history, toIndex);

  if (!from || !to) {
    console.error('Could not load one or both snapshots for diff');
    return null;
  }

  const diff = diffSnapshots(from.ports, to.ports);
  return { from, to, diff };
}

/**
 * Print a replayed snapshot to stdout
 */
function printReplay(index = 0) {
  const entry = replaySnapshot(index);
  if (!entry) return;
  console.log(`\n[Replay] Snapshot at index ${index} — ${entry.timestamp}`);
  printPortList(entry.ports);
}

/**
 * Print a replayed diff between two snapshots
 */
function printReplayDiff(fromIndex, toIndex) {
  const result = replayDiff(fromIndex, toIndex);
  if (!result) return;
  const { from, to, diff } = result;
  console.log(`\n[Replay Diff] ${from.timestamp} → ${to.timestamp}`);
  printDiff(diff);
}

module.exports = {
  getSnapshotAt,
  replaySnapshot,
  replayDiff,
  printReplay,
  printReplayDiff
};
