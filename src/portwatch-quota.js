// portwatch-quota.js — track and enforce per-process port count limits

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const QUOTA_FILE = 'quotas.json';

function getQuotaPath() {
  return path.join(ensureConfigDir(), QUOTA_FILE);
}

function loadQuotas() {
  const p = getQuotaPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveQuotas(quotas) {
  fs.writeFileSync(getQuotaPath(), JSON.stringify(quotas, null, 2));
}

function setQuota(processName, limit) {
  if (typeof limit !== 'number' || limit < 1) throw new Error('limit must be a positive integer');
  const quotas = loadQuotas();
  quotas[processName] = limit;
  saveQuotas(quotas);
  return quotas;
}

function removeQuota(processName) {
  const quotas = loadQuotas();
  delete quotas[processName];
  saveQuotas(quotas);
  return quotas;
}

function getQuota(processName) {
  return loadQuotas()[processName] ?? null;
}

function checkQuotas(entries) {
  const quotas = loadQuotas();
  const counts = {};
  for (const entry of entries) {
    const name = entry.process || 'unknown';
    counts[name] = (counts[name] || 0) + 1;
  }
  const violations = [];
  for (const [proc, limit] of Object.entries(quotas)) {
    const count = counts[proc] || 0;
    if (count > limit) {
      violations.push({ process: proc, limit, count, excess: count - limit });
    }
  }
  return violations;
}

function formatViolation(v) {
  return `[QUOTA] ${v.process}: ${v.count} ports open (limit: ${v.limit}, excess: +${v.excess})`;
}

module.exports = {
  getQuotaPath,
  loadQuotas,
  saveQuotas,
  setQuota,
  removeQuota,
  getQuota,
  checkQuotas,
  formatViolation,
};
