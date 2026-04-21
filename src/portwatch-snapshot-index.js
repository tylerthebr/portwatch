const fs = require('fs');
const path = require('path');
const { loadHistory } = require('./history');

const INDEX_FILE = 'snapshot-index.json';

function getIndexPath(configDir = process.env.PORTWATCH_DIR || path.join(require('os').homedir(), '.portwatch')) {
  return path.join(configDir, INDEX_FILE);
}

function loadIndex(configDir) {
  const p = getIndexPath(configDir);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function saveIndex(entries, configDir) {
  const p = getIndexPath(configDir);
  fs.writeFileSync(p, JSON.stringify(entries, null, 2));
}

function buildIndex(configDir) {
  const history = loadHistory(configDir);
  return history.map((entry, i) => ({
    index: i,
    timestamp: entry.timestamp,
    portCount: Array.isArray(entry.ports) ? entry.ports.length : 0,
    label: entry.label || null,
    tag: entry.tag || null,
  }));
}

function rebuildIndex(configDir) {
  const index = buildIndex(configDir);
  saveIndex(index, configDir);
  return index;
}

function findByLabel(label, configDir) {
  return loadIndex(configDir).filter(e => e.label === label);
}

function findByTag(tag, configDir) {
  return loadIndex(configDir).filter(e => e.tag === tag);
}

function findByDate(dateStr, configDir) {
  return loadIndex(configDir).filter(e => e.timestamp && e.timestamp.startsWith(dateStr));
}

module.exports = {
  getIndexPath,
  loadIndex,
  saveIndex,
  buildIndex,
  rebuildIndex,
  findByLabel,
  findByTag,
  findByDate,
};
