// portwatch-heatmap.js
// Builds a heatmap of port activity frequency over time buckets

const BUCKET_SIZE_MS = 60 * 60 * 1000; // 1 hour buckets by default

function getBucketKey(timestamp, bucketSize = BUCKET_SIZE_MS) {
  const ts = typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp;
  const bucket = Math.floor(ts / bucketSize) * bucketSize;
  return new Date(bucket).toISOString();
}

function buildHeatmap(historyEntries, bucketSize = BUCKET_SIZE_MS) {
  const map = {};

  for (const entry of historyEntries) {
    const bucket = getBucketKey(entry.timestamp, bucketSize);
    if (!map[bucket]) map[bucket] = {};

    const ports = Array.isArray(entry.ports) ? entry.ports : [];
    for (const p of ports) {
      const key = `${p.port}/${p.protocol || 'tcp'}`;
      map[bucket][key] = (map[bucket][key] || 0) + 1;
    }
  }

  return map;
}

function getHotPorts(heatmap, topN = 5) {
  const totals = {};
  for (const bucket of Object.values(heatmap)) {
    for (const [key, count] of Object.entries(bucket)) {
      totals[key] = (totals[key] || 0) + count;
    }
  }
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key, count]) => ({ key, count }));
}

function formatHeatmap(heatmap) {
  const lines = [];
  const buckets = Object.keys(heatmap).sort();
  for (const bucket of buckets) {
    const entries = Object.entries(heatmap[bucket])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');
    lines.push(`  ${bucket}: ${entries || '(none)'}`);
  }
  return lines.length ? lines.join('\n') : '  (no data)';
}

module.exports = { getBucketKey, buildHeatmap, getHotPorts, formatHeatmap };
