// tags.js — assign and manage user-defined tags for ports

const { loadConfig, saveConfig } = require('./config');

function getTags() {
  const config = loadConfig();
  return config.tags || {};
}

function setTag(port, tag) {
  if (typeof port !== 'number' || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${port}`);
  }
  if (typeof tag !== 'string' || tag.trim() === '') {
    throw new Error('Tag must be a non-empty string');
  }
  const config = loadConfig();
  if (!config.tags) config.tags = {};
  config.tags[port] = tag.trim();
  saveConfig(config);
  return config.tags[port];
}

function removeTag(port) {
  const config = loadConfig();
  if (!config.tags || !(port in config.tags)) return false;
  delete config.tags[port];
  saveConfig(config);
  return true;
}

function getTag(port) {
  const tags = getTags();
  return tags[port] || null;
}

function clearTags() {
  const config = loadConfig();
  config.tags = {};
  saveConfig(config);
}

function applyTagsToEntries(entries) {
  const tags = getTags();
  return entries.map(entry => ({
    ...entry,
    tag: tags[entry.port] || null
  }));
}

module.exports = {
  getTags,
  setTag,
  removeTag,
  getTag,
  clearTags,
  applyTagsToEntries
};
