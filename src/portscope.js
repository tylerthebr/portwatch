// portscope.js — scope port entries to named environments (dev, staging, ci, etc.)

const fs = require('fs');
const path = require('path');
const os = require('os');

const SCOPE_DIR = path.join(os.homedir(), '.portwatch', 'scopes');

function getScopePath(name) {
  return path.join(SCOPE_DIR, `${name}.json`);
}

function ensureScopeDir() {
  if (!fs.existsSync(SCOPE_DIR)) {
    fs.mkdirSync(SCOPE_DIR, { recursive: true });
  }
}

function listScopes() {
  ensureScopeDir();
  return fs.readdirSync(SCOPE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

function loadScope(name) {
  const p = getScopePath(name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveScope(name, entries) {
  ensureScopeDir();
  const data = { name, savedAt: new Date().toISOString(), entries };
  fs.writeFileSync(getScopePath(name), JSON.stringify(data, null, 2));
  return data;
}

function removeScope(name) {
  const p = getScopePath(name);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    return true;
  }
  return false;
}

function diffScopes(nameA, nameB) {
  const a = loadScope(nameA);
  const b = loadScope(nameB);
  if (!a || !b) throw new Error(`Scope not found: ${!a ? nameA : nameB}`);

  const aKeys = new Set(a.entries.map(e => `${e.port}/${e.protocol}`));
  const bKeys = new Set(b.entries.map(e => `${e.port}/${e.protocol}`));

  const added = b.entries.filter(e => !aKeys.has(`${e.port}/${e.protocol}`));
  const removed = a.entries.filter(e => !bKeys.has(`${e.port}/${e.protocol}`));

  return { added, removed, from: nameA, to: nameB };
}

module.exports = { getScopePath, listScopes, loadScope, saveScope, removeScope, diffScopes };
