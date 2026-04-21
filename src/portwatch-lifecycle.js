// portwatch-lifecycle.js
// Tracks port lifecycle events: first seen, last seen, uptime, and close events

const { loadHistory } = require('./history');

function buildLifecycleMap(history) {
  const map = {};

  for (const entry of history) {
    const { timestamp, ports = [] } = entry;
    for (const p of ports) {
      const key = `${p.port}/${p.protocol}`;
      if (!map[key]) {
        map[key] = {
          port: p.port,
          protocol: p.protocol,
          process: p.process || null,
          firstSeen: timestamp,
          lastSeen: timestamp,
          appearances: 1,
          gaps: []
        };
      } else {
        const prev = map[key].lastSeen;
        const gapMs = new Date(timestamp) - new Date(prev);
        if (gapMs > 0) {
          map[key].gaps.push(gapMs);
        }
        map[key].lastSeen = timestamp;
        map[key].appearances++;
      }
    }
  }

  return map;
}

function calcUptimeDuration(entry) {
  const start = new Date(entry.firstSeen);
  const end = new Date(entry.lastSeen);
  return Math.max(0, end - start);
}

function getLifecycleForPort(port, protocol, history) {
  const map = buildLifecycleMap(history);
  return map[`${port}/${protocol}`] || null;
}

function buildLifecycleReport(history) {
  const map = buildLifecycleMap(history);
  return Object.values(map).map(entry => ({
    ...entry,
    uptimeMs: calcUptimeDuration(entry),
    avgGapMs: entry.gaps.length
      ? Math.round(entry.gaps.reduce((a, b) => a + b, 0) / entry.gaps.length)
      : 0
  }));
}

function formatLifecycleEntry(entry) {
  const uptimeSec = Math.round(entry.uptimeMs / 1000);
  return `[${entry.port}/${entry.protocol}] process=${entry.process || 'unknown'} ` +
    `first=${entry.firstSeen} last=${entry.lastSeen} ` +
    `appearances=${entry.appearances} uptime=${uptimeSec}s avgGap=${Math.round(entry.avgGapMs / 1000)}s`;
}

module.exports = {
  buildLifecycleMap,
  calcUptimeDuration,
  getLifecycleForPort,
  buildLifecycleReport,
  formatLifecycleEntry
};
