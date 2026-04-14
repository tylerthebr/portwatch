const fs = require('fs');
const path = require('path');
const { loadHistory } = require('./history');
const { saveSnapshot, loadSnapshot } = require('./snapshot');

function getRestorePath() {
  return path.join(require('os').homedir(), '.portwatch', 'restore-log.json');
}

function loadRestoreLog() {
  const p = getRestorePath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function saveRestoreLog(log) {
  const p = getRestorePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(log, null, 2));
}

function findSnapshotByIndex(history, index) {
  if (!history || !history.length) return null;
  const idx = index < 0 ? history.length + index : index;
  return history[idx] || null;
}

function findSnapshotByTimestamp(history, timestamp) {
  return history.find(e => e.timestamp && e.timestamp.startsWith(timestamp)) || null;
}

function restoreSnapshot(entry, options = {}) {
  if (!entry || !entry.ports) throw new Error('Invalid snapshot entry');
  const { label = 'restored', dry = false } = options;
  if (!dry) {
    saveSnapshot(entry.ports);
    const log = loadRestoreLog();
    log.push({ restoredAt: new Date().toISOString(), from: entry.timestamp, label });
    saveRestoreLog(log);
  }
  return { ports: entry.ports, timestamp: entry.timestamp, label, dry };
}

function formatRestoreResult(result) {
  const prefix = result.dry ? '[dry-run] ' : '';
  return `${prefix}Restored snapshot from ${result.timestamp} (${result.ports.length} ports) as "${result.label}"`;
}

module.exports = {
  getRestorePath,
  loadRestoreLog,
  saveRestoreLog,
  findSnapshotByIndex,
  findSnapshotByTimestamp,
  restoreSnapshot,
  formatRestoreResult
};
