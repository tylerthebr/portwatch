// portwatch-threshold.js
// Tracks port count thresholds and fires alerts when limits are crossed

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const THRESHOLD_FILE = 'thresholds.json';

function getThresholdPath() {
  return path.join(ensureConfigDir(), THRESHOLD_FILE);
}

function loadThresholds() {
  const p = getThresholdPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveThresholds(thresholds) {
  fs.writeFileSync(getThresholdPath(), JSON.stringify(thresholds, null, 2));
}

function setThreshold(name, opts) {
  const thresholds = loadThresholds();
  thresholds[name] = {
    name,
    maxPorts: opts.maxPorts ?? null,
    minPorts: opts.minPorts ?? null,
    process: opts.process ?? null,
    createdAt: new Date().toISOString()
  };
  saveThresholds(thresholds);
  return thresholds[name];
}

function removeThreshold(name) {
  const thresholds = loadThresholds();
  if (!thresholds[name]) return false;
  delete thresholds[name];
  saveThresholds(thresholds);
  return true;
}

function checkThresholds(entries) {
  const thresholds = loadThresholds();
  const violations = [];

  for (const t of Object.values(thresholds)) {
    const relevant = t.process
      ? entries.filter(e => e.process === t.process)
      : entries;

    const count = relevant.length;

    if (t.maxPorts !== null && count > t.maxPorts) {
      violations.push({
        threshold: t.name,
        type: 'max',
        limit: t.maxPorts,
        actual: count,
        process: t.process ?? null
      });
    }

    if (t.minPorts !== null && count < t.minPorts) {
      violations.push({
        threshold: t.name,
        type: 'min',
        limit: t.minPorts,
        actual: count,
        process: t.process ?? null
      });
    }
  }

  return violations;
}

function formatViolation(v) {
  const scope = v.process ? ` (process: ${v.process})` : '';
  const dir = v.type === 'max' ? 'exceeded' : 'below';
  return `[threshold:${v.threshold}] Port count ${dir} ${v.type} limit: ${v.actual} (limit: ${v.limit})${scope}`;
}

module.exports = {
  getThresholdPath,
  loadThresholds,
  saveThresholds,
  setThreshold,
  removeThreshold,
  checkThresholds,
  formatViolation
};
