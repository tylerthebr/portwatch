// portwatch-cooldown.js
// Manages cooldown periods between repeated alerts for the same port

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const COOLDOWN_FILE = 'cooldowns.json';

function getCooldownPath() {
  return path.join(ensureConfigDir(), COOLDOWN_FILE);
}

function loadCooldowns() {
  const p = getCooldownPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveCooldowns(cooldowns) {
  fs.writeFileSync(getCooldownPath(), JSON.stringify(cooldowns, null, 2));
}

function setCooldown(port, durationMs = 60000) {
  const cooldowns = loadCooldowns();
  cooldowns[String(port)] = {
    expiresAt: Date.now() + durationMs,
    durationMs
  };
  saveCooldowns(cooldowns);
}

function isOnCooldown(port) {
  const cooldowns = loadCooldowns();
  const entry = cooldowns[String(port)];
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

function clearCooldown(port) {
  const cooldowns = loadCooldowns();
  delete cooldowns[String(port)];
  saveCooldowns(cooldowns);
}

function clearAllCooldowns() {
  saveCooldowns({});
}

function getActiveCooldowns() {
  const cooldowns = loadCooldowns();
  const now = Date.now();
  return Object.entries(cooldowns)
    .filter(([, v]) => now < v.expiresAt)
    .map(([port, v]) => ({
      port: Number(port),
      expiresAt: v.expiresAt,
      remainingMs: v.expiresAt - now,
      durationMs: v.durationMs
    }));
}

function pruneExpired() {
  const cooldowns = loadCooldowns();
  const now = Date.now();
  const pruned = Object.fromEntries(
    Object.entries(cooldowns).filter(([, v]) => now < v.expiresAt)
  );
  saveCooldowns(pruned);
  return pruned;
}

module.exports = {
  getCooldownPath,
  loadCooldowns,
  saveCooldowns,
  setCooldown,
  isOnCooldown,
  clearCooldown,
  clearAllCooldowns,
  getActiveCooldowns,
  pruneExpired
};
