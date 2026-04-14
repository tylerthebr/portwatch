const fs = require('fs');
const path = require('path');
const os = require('os');

const CHANGELOG_DIR = path.join(os.homedir(), '.portwatch');
const CHANGELOG_FILE = path.join(CHANGELOG_DIR, 'changelog.json');

function getChangelogPath() {
  return CHANGELOG_FILE;
}

function loadChangelog() {
  try {
    if (!fs.existsSync(CHANGELOG_FILE)) return [];
    const raw = fs.readFileSync(CHANGELOG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveChangelog(entries) {
  if (!fs.existsSync(CHANGELOG_DIR)) {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
  }
  fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(entries, null, 2));
}

function appendChangelogEntry(diff, label = null) {
  const entries = loadChangelog();
  const entry = {
    id: Date.now().toString(36),
    timestamp: new Date().toISOString(),
    label: label || null,
    added: diff.added || [],
    removed: diff.removed || [],
    changed: diff.changed || []
  };
  entries.push(entry);
  saveChangelog(entries);
  return entry;
}

function getRecentChanges(limit = 10) {
  const entries = loadChangelog();
  return entries.slice(-limit).reverse();
}

function clearChangelog() {
  saveChangelog([]);
}

function formatChangelogEntry(entry) {
  const lines = [`[${entry.timestamp}] ${entry.label || entry.id}`];
  if (entry.added.length) lines.push(`  + added: ${entry.added.map(e => `${e.port}/${e.protocol}`).join(', ')}`);
  if (entry.removed.length) lines.push(`  - removed: ${entry.removed.map(e => `${e.port}/${e.protocol}`).join(', ')}`);
  if (entry.changed.length) lines.push(`  ~ changed: ${entry.changed.map(e => `${e.port}/${e.protocol}`).join(', ')}`);
  return lines.join('\n');
}

module.exports = {
  getChangelogPath,
  loadChangelog,
  saveChangelog,
  appendChangelogEntry,
  getRecentChanges,
  clearChangelog,
  formatChangelogEntry
};
