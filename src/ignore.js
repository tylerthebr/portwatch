const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const IGNORE_FILE = 'ignore.json';

function getIgnorePath() {
  return path.join(ensureConfigDir(), IGNORE_FILE);
}

function loadIgnoreList() {
  const filePath = getIgnorePath();
  if (!fs.existsSync(filePath)) return { ports: [], processes: [] };
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { ports: [], processes: [] };
  }
}

function saveIgnoreList(ignoreList) {
  fs.writeFileSync(getIgnorePath(), JSON.stringify(ignoreList, null, 2));
}

function addIgnoredPort(port) {
  const list = loadIgnoreList();
  const p = Number(port);
  if (!list.ports.includes(p)) {
    list.ports.push(p);
    saveIgnoreList(list);
  }
  return list;
}

function removeIgnoredPort(port) {
  const list = loadIgnoreList();
  list.ports = list.ports.filter(p => p !== Number(port));
  saveIgnoreList(list);
  return list;
}

function addIgnoredProcess(name) {
  const list = loadIgnoreList();
  if (!list.processes.includes(name)) {
    list.processes.push(name);
    saveIgnoreList(list);
  }
  return list;
}

function removeIgnoredProcess(name) {
  const list = loadIgnoreList();
  list.processes = list.processes.filter(p => p !== name);
  saveIgnoreList(list);
  return list;
}

function applyIgnoreList(entries) {
  const list = loadIgnoreList();
  return entries.filter(entry => {
    if (list.ports.includes(Number(entry.port))) return false;
    if (entry.process && list.processes.includes(entry.process)) return false;
    return true;
  });
}

function clearIgnoreList() {
  saveIgnoreList({ ports: [], processes: [] });
}

module.exports = {
  getIgnorePath,
  loadIgnoreList,
  saveIgnoreList,
  addIgnoredPort,
  removeIgnoredPort,
  addIgnoredProcess,
  removeIgnoredProcess,
  applyIgnoreList,
  clearIgnoreList,
};
