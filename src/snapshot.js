const fs = require('fs');
const path = require('path');

const DEFAULT_SNAPSHOT_PATH = path.join(process.cwd(), '.portwatch-snapshot.json');

/**
 * Save a port snapshot to disk
 * @param {Object[]} ports - array of port objects from scanner
 * @param {string} [snapshotPath] - optional custom path
 */
function saveSnapshot(ports, snapshotPath = DEFAULT_SNAPSHOT_PATH) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    ports,
  };
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
}

/**
 * Load a previously saved snapshot from disk
 * @param {string} [snapshotPath] - optional custom path
 * @returns {Object|null} snapshot object or null if none exists
 */
function loadSnapshot(snapshotPath = DEFAULT_SNAPSHOT_PATH) {
  if (!fs.existsSync(snapshotPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(snapshotPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Compare two port arrays and return a diff object
 * @param {Object[]} previous - ports from last snapshot
 * @param {Object[]} current - ports from current scan
 * @returns {{ added: Object[], removed: Object[] }}
 */
function diffSnapshots(previous, current) {
  const prevMap = new Map(previous.map((p) => [`${p.port}:${p.protocol}`, p]));
  const currMap = new Map(current.map((p) => [`${p.port}:${p.protocol}`, p]));

  const added = current.filter((p) => !prevMap.has(`${p.port}:${p.protocol}`));
  const removed = previous.filter((p) => !currMap.has(`${p.port}:${p.protocol}`));

  return { added, removed };
}

module.exports = { saveSnapshot, loadSnapshot, diffSnapshots, DEFAULT_SNAPSHOT_PATH };
