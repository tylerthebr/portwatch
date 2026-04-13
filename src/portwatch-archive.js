const fs = require('fs');
const path = require('path');
const { loadHistory } = require('./history');
const { ensureConfigDir } = require('./config');

function getArchivePath() {
  return path.join(ensureConfigDir(), 'archive.json');
}

function loadArchive() {
  const archivePath = getArchivePath();
  if (!fs.existsSync(archivePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  } catch {
    return [];
  }
}

function saveArchive(entries) {
  fs.writeFileSync(getArchivePath(), JSON.stringify(entries, null, 2));
}

function archiveHistory(label) {
  const history = loadHistory();
  if (!history || history.length === 0) return null;
  const archive = loadArchive();
  const entry = {
    id: `archive-${Date.now()}`,
    label: label || `Archive ${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    entryCount: history.length,
    snapshot: history
  };
  archive.push(entry);
  saveArchive(archive);
  return entry;
}

function getArchiveById(id) {
  return loadArchive().find(a => a.id === id) || null;
}

function removeArchive(id) {
  const archive = loadArchive().filter(a => a.id !== id);
  saveArchive(archive);
  return archive;
}

function clearArchive() {
  saveArchive([]);
}

function formatArchiveList(archive) {
  if (!archive || archive.length === 0) return 'No archived snapshots.';
  return archive.map(a =>
    `[${a.id}] ${a.label} — ${a.entryCount} entries — ${a.createdAt}`
  ).join('\n');
}

module.exports = {
  getArchivePath,
  loadArchive,
  saveArchive,
  archiveHistory,
  getArchiveById,
  removeArchive,
  clearArchive,
  formatArchiveList
};
