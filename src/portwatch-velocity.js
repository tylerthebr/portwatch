/**
 * portwatch-velocity.js
 * Tracks rate of port change over time (ports opened/closed per interval).
 */

/**
 * Build a velocity map from an ordered array of history entries.
 * Each entry: { timestamp, ports: [{port, protocol, process}] }
 * Returns an array of { timestamp, added, removed, velocity } objects.
 */
function buildVelocityMap(history) {
  if (!Array.isArray(history) || history.length < 2) return [];

  const result = [];

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];

    const prevKeys = new Set((prev.ports || []).map(p => `${p.port}/${p.protocol}`));
    const currKeys = new Set((curr.ports || []).map(p => `${p.port}/${p.protocol}`));

    const added = [...currKeys].filter(k => !prevKeys.has(k)).length;
    const removed = [...prevKeys].filter(k => !currKeys.has(k)).length;

    const deltaMs = new Date(curr.timestamp) - new Date(prev.timestamp);
    const deltaMin = deltaMs / 60000 || 1;
    const velocity = parseFloat(((added + removed) / deltaMin).toFixed(3));

    result.push({
      timestamp: curr.timestamp,
      added,
      removed,
      velocity
    });
  }

  return result;
}

/**
 * Returns the peak velocity entry from a velocity map.
 */
function peakVelocity(velocityMap) {
  if (!velocityMap.length) return null;
  return velocityMap.reduce((max, entry) => entry.velocity > max.velocity ? entry : max, velocityMap[0]);
}

/**
 * Returns the average velocity across all intervals.
 */
function averageVelocity(velocityMap) {
  if (!velocityMap.length) return 0;
  const total = velocityMap.reduce((sum, e) => sum + e.velocity, 0);
  return parseFloat((total / velocityMap.length).toFixed(3));
}

/**
 * Builds a human-readable velocity report.
 */
function formatVelocityReport(velocityMap) {
  if (!velocityMap.length) return 'No velocity data available.';

  const peak = peakVelocity(velocityMap);
  const avg = averageVelocity(velocityMap);

  const lines = [
    `Port Change Velocity Report`,
    `Intervals analyzed : ${velocityMap.length}`,
    `Average velocity   : ${avg} changes/min`,
    `Peak velocity      : ${peak.velocity} changes/min at ${peak.timestamp}`,
    ``,
    `Interval breakdown:`
  ];

  for (const entry of velocityMap) {
    lines.push(`  ${entry.timestamp}  +${entry.added} -${entry.removed}  (${entry.velocity}/min)`);
  }

  return lines.join('\n');
}

module.exports = { buildVelocityMap, peakVelocity, averageVelocity, formatVelocityReport };
