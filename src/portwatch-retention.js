/**
 * portwatch-retention.js
 * Manages retention policies for snapshots and history entries.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const RETENTION_FILE = 'retention.json';

function getRetentionPath() {
  return path.join(os.homedir(), '.portwatch', RETENTION_FILE);
}

function loadRetentionPolicy() {
  const p = getRetentionPath();
  if (!fs.existsSync(p)) return getDefaultPolicy();
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return getDefaultPolicy();
  }
}

function saveRetentionPolicy(policy) {
  const p = getRetentionPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(policy, null, 2));
}

function getDefaultPolicy() {
  return {
    maxAgeDays: 30,
    maxEntries: 500,
    keepTagged: true
  };
}

function applyRetention(entries, taggedIds = new Set()) {
  const policy = loadRetentionPolicy();
  const now = Date.now();
  const maxAgeMs = policy.maxAgeDays * 24 * 60 * 60 * 1000;

  let filtered = entries.filter(entry => {
    if (policy.keepTagged && taggedIds.has(entry.id || entry.timestamp)) return true;
    const age = now - new Date(entry.timestamp).getTime();
    return age <= maxAgeMs;
  });

  if (filtered.length > policy.maxEntries) {
    const overflow = filtered.length - policy.maxEntries;
    const untagged = filtered.filter(e => !taggedIds.has(e.id || e.timestamp));
    const toRemove = new Set(untagged.slice(0, overflow).map(e => e.id || e.timestamp));
    filtered = filtered.filter(e => !toRemove.has(e.id || e.timestamp));
  }

  return filtered;
}

function buildRetentionReport(before, after) {
  const removed = before.length - after.length;
  return {
    before: before.length,
    after: after.length,
    removed,
    policy: loadRetentionPolicy()
  };
}

function formatRetentionReport(report) {
  return [
    `Retention Policy Applied`,
    `  Max age: ${report.policy.maxAgeDays} days`,
    `  Max entries: ${report.policy.maxEntries}`,
    `  Keep tagged: ${report.policy.keepTagged}`,
    `  Before: ${report.before} entries`,
    `  After:  ${report.after} entries`,
    `  Removed: ${report.removed} entries`
  ].join('\n');
}

module.exports = {
  getRetentionPath,
  loadRetentionPolicy,
  saveRetentionPolicy,
  getDefaultPolicy,
  applyRetention,
  buildRetentionReport,
  formatRetentionReport
};
