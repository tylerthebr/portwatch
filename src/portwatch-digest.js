// portwatch-digest.js
// Generates periodic digest summaries of port activity over a time window

const { loadHistory } = require('./history');
const { buildFrequencyMap, topPorts } = require('./porttrend');
const { formatTimestamp } = require('./formatter');

const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function filterByWindow(entries, windowMs = DEFAULT_WINDOW_MS) {
  const cutoff = Date.now() - windowMs;
  return entries.filter(e => new Date(e.timestamp).getTime() >= cutoff);
}

function buildDigest(historyEntries, windowMs = DEFAULT_WINDOW_MS) {
  const recent = filterByWindow(historyEntries, windowMs);

  if (!recent.length) {
    return { empty: true, window: windowMs, generated: new Date().toISOString() };
  }

  const allPorts = recent.flatMap(e => e.ports || []);
  const freqMap = buildFrequencyMap(recent);
  const top = topPorts(freqMap, 5);

  const openedSet = new Set();
  const closedSet = new Set();

  for (const entry of recent) {
    for (const p of entry.opened || []) openedSet.add(p);
    for (const p of entry.closed || []) closedSet.add(p);
  }

  return {
    empty: false,
    window: windowMs,
    generated: new Date().toISOString(),
    snapshotCount: recent.length,
    uniquePorts: new Set(allPorts.map(p => p.port)).size,
    topPorts: top,
    totalOpened: openedSet.size,
    totalClosed: closedSet.size,
    firstSeen: recent[0].timestamp,
    lastSeen: recent[recent.length - 1].timestamp,
  };
}

function formatDigest(digest) {
  if (digest.empty) {
    return `[digest] No activity in the last window.`;
  }

  const lines = [
    `=== Port Activity Digest ===`,
    `Generated : ${formatTimestamp(digest.generated)}`,
    `Window    : ${Math.round(digest.window / 60000)} min`,
    `Snapshots : ${digest.snapshotCount}`,
    `Unique ports seen`,
    `Ports opened : ${digest.totalOpened}`,
    `Ports closed : ${digest.totalClosed}`,
    ``,
    `Top ports by frequency:`,
    ...digest.topPorts.map((p, i) => `  ${i + 1}. :${p.port} (${p.count}x)`),
  ];

  return lines.join('\n');
}

async function generateDigest(windowMs = DEFAULT_WINDOW_MS) {
  const history = await loadHistory();
  return buildDigest(history, windowMs);
}

module.exports = { filterByWindow, buildDigest, formatDigest, generateDigest };
