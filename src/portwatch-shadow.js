// portwatch-shadow.js
// Tracks "shadow" ports — ports that appear briefly and vanish before a full scan cycle

const fs = require('fs');
const path = require('path');
const os = require('os');

const SHADOW_DIR = path.join(os.homedir(), '.portwatch');
const SHADOW_FILE = path.join(SHADOW_DIR, 'shadow.json');
const DEFAULT_TTL_MS = 5000;

function getShadowPath() {
  return SHADOW_FILE;
}

function loadShadowLog() {
  try {
    if (!fs.existsSync(SHADOW_FILE)) return [];
    return JSON.parse(fs.readFileSync(SHADOW_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveShadowLog(entries) {
  if (!fs.existsSync(SHADOW_DIR)) fs.mkdirSync(SHADOW_DIR, { recursive: true });
  fs.writeFileSync(SHADOW_FILE, JSON.stringify(entries, null, 2));
}

function recordShadow(entry) {
  const log = loadShadowLog();
  const existing = log.find(e => e.port === entry.port && e.protocol === entry.protocol);
  if (existing) {
    existing.seenCount = (existing.seenCount || 1) + 1;
    existing.lastSeen = Date.now();
  } else {
    log.push({ ...entry, firstSeen: Date.now(), lastSeen: Date.now(), seenCount: 1 });
  }
  saveShadowLog(log);
}

function getShadowEntries(ttlMs = DEFAULT_TTL_MS) {
  const log = loadShadowLog();
  const cutoff = Date.now() - ttlMs;
  return log.filter(e => e.lastSeen >= cutoff);
}

function pruneShadowLog(ttlMs = DEFAULT_TTL_MS) {
  const log = loadShadowLog();
  const cutoff = Date.now() - ttlMs;
  const pruned = log.filter(e => e.lastSeen >= cutoff);
  sav);
  return log.length - pruned.length;
}

function detectShadows(previous, current) {
  const currentPorts = new Set(current.map(e => `${e.port}:${e.protocol}`));
  return previous.filter(e => !currentPorts.has(`${e.port}:${e.protocol}`));
}

function formatShadowEntry(entry) {
  const age = Math.round((Date.now() - entry.firstSeen) / 1000);
  return `[SHADOW] port=${entry.port} proto=${entry.protocol} process=${entry.process || '?'} seen=${entry.seenCount}x age=${age}s`;
}

module.exports = {
  getShadowPath,
  loadShadowLog,
  saveShadowLog,
  recordShadow,
  getShadowEntries,
  pruneShadowLog,
  detectShadows,
  formatShadowEntry
};
