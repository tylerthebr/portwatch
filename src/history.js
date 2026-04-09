const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');

const MAX_HISTORY_ENTRIES = 50;

function getHistoryPath() {
  const config = loadConfig();
  return path.join(config.configDir, 'history.json');
}

function loadHistory() {
  const historyPath = getHistoryPath();
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(historyPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  const historyPath = getHistoryPath();
  const trimmed = entries.slice(-MAX_HISTORY_ENTRIES);
  fs.writeFileSync(historyPath, JSON.stringify(trimmed, null, 2));
}

function appendHistoryEntry(diff) {
  if (!diff || (diff.added.length === 0 && diff.removed.length === 0)) {
    return;
  }
  const entries = loadHistory();
  entries.push({
    timestamp: new Date().toISOString(),
    added: diff.added,
    removed: diff.removed,
  });
  saveHistory(entries);
}

function clearHistory() {
  const historyPath = getHistoryPath();
  if (fs.existsSync(historyPath)) {
    fs.unlinkSync(historyPath);
  }
}

function getRecentHistory(limit = 10) {
  const entries = loadHistory();
  return entries.slice(-limit);
}

module.exports = { loadHistory, saveHistory, appendHistoryEntry, clearHistory, getRecentHistory };
