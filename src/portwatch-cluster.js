// portwatch-cluster.js — group ports into logical clusters by proximity and process

const DEFAULT_RANGE_GAP = 10;

/**
 * Cluster entries where consecutive ports are within `gap` of each other.
 * Returns array of { start, end, entries }.
 */
function clusterByProximity(entries, gap = DEFAULT_RANGE_GAP) {
  if (!entries || entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => a.port - b.port);
  const clusters = [];
  let current = { start: sorted[0].port, end: sorted[0].port, entries: [sorted[0]] };

  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.port - current.end <= gap) {
      current.end = entry.port;
      current.entries.push(entry);
    } else {
      clusters.push(current);
      current = { start: entry.port, end: entry.port, entries: [entry] };
    }
  }
  clusters.push(current);
  return clusters;
}

/**
 * Cluster entries by shared process name.
 * Returns a map of processName -> entries[].
 */
function clusterByProcess(entries) {
  const map = {};
  for (const entry of entries) {
    const key = entry.process || 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(entry);
  }
  return map;
}

/**
 * Build a full cluster report combining proximity and process clusters.
 */
function buildClusterReport(entries, gap = DEFAULT_RANGE_GAP) {
  return {
    proximity: clusterByProximity(entries, gap),
    byProcess: clusterByProcess(entries),
    total: entries.length,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Format a proximity cluster for display.
 */
function formatCluster(cluster) {
  const portList = cluster.entries.map(e => e.port).join(', ');
  return `[${cluster.start}-${cluster.end}] (${cluster.entries.length} ports): ${portList}`;
}

module.exports = {
  clusterByProximity,
  clusterByProcess,
  buildClusterReport,
  formatCluster
};
