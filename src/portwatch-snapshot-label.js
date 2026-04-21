const fs = require('fs');
const path = require('path');
const os = require('os');

const LABEL_FILE = 'snapshot-labels.json';

function getLabelPath() {
  return path.join(os.homedir(), '.portwatch', LABEL_FILE);
}

function loadLabels() {
  const p = getLabelPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveLabels(labels) {
  const p = getLabelPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(labels, null, 2));
}

function setSnapshotLabel(snapshotId, label) {
  if (!snapshotId || !label) throw new Error('snapshotId and label are required');
  const labels = loadLabels();
  labels[snapshotId] = { label, createdAt: new Date().toISOString() };
  saveLabels(labels);
  return labels[snapshotId];
}

function getSnapshotLabel(snapshotId) {
  const labels = loadLabels();
  return labels[snapshotId] || null;
}

function removeSnapshotLabel(snapshotId) {
  const labels = loadLabels();
  if (!labels[snapshotId]) return false;
  delete labels[snapshotId];
  saveLabels(labels);
  return true;
}

function listSnapshotLabels() {
  return loadLabels();
}

function resolveLabel(snapshotId) {
  const entry = getSnapshotLabel(snapshotId);
  return entry ? entry.label : snapshotId;
}

function formatLabelEntry(snapshotId, entry) {
  return `${snapshotId}  →  "${entry.label}"  (set ${entry.createdAt})`;
}

module.exports = {
  getLabelPath,
  loadLabels,
  saveLabels,
  setSnapshotLabel,
  getSnapshotLabel,
  removeSnapshotLabel,
  listSnapshotLabels,
  resolveLabel,
  formatLabelEntry
};
