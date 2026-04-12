// portaliases.js — manage human-friendly aliases for ports

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getAliasPath() {
  return path.join(ensureConfigDir(), 'aliases.json');
}

function loadAliases() {
  const p = getAliasPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveAliases(aliases) {
  fs.writeFileSync(getAliasPath(), JSON.stringify(aliases, null, 2));
}

function setAlias(port, alias) {
  const aliases = loadAliases();
  aliases[String(port)] = alias;
  saveAliases(aliases);
  return aliases;
}

function getAlias(port) {
  const aliases = loadAliases();
  return aliases[String(port)] || null;
}

function removeAlias(port) {
  const aliases = loadAliases();
  delete aliases[String(port)];
  saveAliases(aliases);
  return aliases;
}

function clearAliases() {
  saveAliases({});
}

function annotateWithAliases(entries) {
  const aliases = loadAliases();
  return entries.map(entry => {
    const alias = aliases[String(entry.port)];
    return alias ? { ...entry, alias } : entry;
  });
}

module.exports = {
  getAliasPath,
  loadAliases,
  saveAliases,
  setAlias,
  getAlias,
  removeAlias,
  clearAliases,
  annotateWithAliases
};
