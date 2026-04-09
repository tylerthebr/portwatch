const { loadSnapshot, saveSnapshot } = require('./snapshot');
const { loadConfig } = require('./config');
const path = require('path');
const os = require('os');
const fs = require('fs');

const BASELINE_FILENAME = 'baseline.json';

function getBaselinePath() {
  const config = loadConfig();
  const dir = config.configDir || path.join(os.homedir(), '.portwatch');
  return path.join(dir, BASELINE_FILENAME);
}

function saveBaseline(ports) {
  const baselinePath = getBaselinePath();
  const dir = path.dirname(baselinePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const entry = {
    timestamp: new Date().toISOString(),
    ports
  };
  fs.writeFileSync(baselinePath, JSON.stringify(entry, null, 2), 'utf8');
  return entry;
}

function loadBaseline() {
  const baselinePath = getBaselinePath();
  if (!fs.existsSync(baselinePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(baselinePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearBaseline() {
  const baselinePath = getBaselinePath();
  if (fs.existsSync(baselinePath)) {
    fs.unlinkSync(baselinePath);
    return true;
  }
  return false;
}

function diffFromBaseline(currentPorts) {
  const baseline = loadBaseline();
  if (!baseline) {
    return { hasBaseline: false, added: [], removed: [], unchanged: currentPorts };
  }
  const { diffSnapshots } = require('./snapshot');
  const diff = diffSnapshots(baseline.ports, currentPorts);
  return { hasBaseline: true, baselineTimestamp: baseline.timestamp, ...diff };
}

module.exports = { getBaselinePath, saveBaseline, loadBaseline, clearBaseline, diffFromBaseline };
