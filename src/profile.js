const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const PROFILES_FILE = path.join(ensureConfigDir(), 'profiles.json');

function loadProfiles() {
  if (!fs.existsSync(PROFILES_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveProfiles(profiles) {
  ensureConfigDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

function getProfile(name) {
  const profiles = loadProfiles();
  return profiles[name] || null;
}

function setProfile(name, config) {
  if (!name || typeof name !== 'string') throw new Error('Profile name must be a non-empty string');
  const profiles = loadProfiles();
  profiles[name] = { ...config, updatedAt: new Date().toISOString() };
  saveProfiles(profiles);
  return profiles[name];
}

function removeProfile(name) {
  const profiles = loadProfiles();
  if (!profiles[name]) return false;
  delete profiles[name];
  saveProfiles(profiles);
  return true;
}

function listProfiles() {
  return Object.entries(loadProfiles()).map(([name, config]) => ({ name, ...config }));
}

function clearProfiles() {
  saveProfiles({});
}

module.exports = { loadProfiles, saveProfiles, getProfile, setProfile, removeProfile, listProfiles, clearProfiles };
