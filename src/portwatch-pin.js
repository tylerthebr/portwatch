// portwatch-pin.js — pin ports to track them with priority alerts

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getPinPath() {
  return path.join(ensureConfigDir(), 'pins.json');
}

function loadPins() {
  const p = getPinPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function savePins(pins) {
  fs.writeFileSync(getPinPath(), JSON.stringify(pins, null, 2));
}

function pinPort(port, label = '') {
  const pins = loadPins();
  pins[String(port)] = { port: Number(port), label, pinnedAt: new Date().toISOString() };
  savePins(pins);
  return pins[String(port)];
}

function unpinPort(port) {
  const pins = loadPins();
  const existed = !!pins[String(port)];
  delete pins[String(port)];
  savePins(pins);
  return existed;
}

function isPinned(port) {
  const pins = loadPins();
  return !!pins[String(port)];
}

function listPins() {
  return Object.values(loadPins());
}

function clearPins() {
  savePins({});
}

function filterPinned(entries) {
  const pins = loadPins();
  return entries.filter(e => pins[String(e.port)]);
}

module.exports = {
  getPinPath,
  loadPins,
  savePins,
  pinPort,
  unpinPort,
  isPinned,
  listPins,
  clearPins,
  filterPinned,
};
