// portwatch-suppress.js
// Manage suppression rules to silence specific ports or patterns from alerts

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getSuppressPath() {
  return path.join(ensureConfigDir(), 'suppress.json');
}

function loadSuppressions() {
  const p = getSuppressPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function saveSuppressions(list) {
  fs.writeFileSync(getSuppressPath(), JSON.stringify(list, null, 2));
}

function addSuppression(rule) {
  const list = loadSuppressions();
  const exists = list.some(
    r => r.port === rule.port && r.reason === rule.reason
  );
  if (exists) return false;
  list.push({ ...rule, createdAt: new Date().toISOString() });
  saveSuppressions(list);
  return true;
}

function removeSuppression(port) {
  const list = loadSuppressions();
  const next = list.filter(r => r.port !== port);
  saveSuppressions(next);
  return list.length !== next.length;
}

function isSuppressed(port) {
  const list = loadSuppressions();
  return list.some(r => {
    if (typeof r.port === 'number') return r.port === port;
    if (typeof r.port === 'string' && r.port.includes('-')) {
      const [lo, hi] = r.port.split('-').map(Number);
      return port >= lo && port <= hi;
    }
    return false;
  });
}

function applySuppressions(entries) {
  return entries.filter(e => !isSuppressed(e.port));
}

function clearSuppressions() {
  saveSuppressions([]);
}

module.exports = {
  getSuppressPath,
  loadSuppressions,
  saveSuppressions,
  addSuppression,
  removeSuppression,
  isSuppressed,
  applySuppressions,
  clearSuppressions,
};
