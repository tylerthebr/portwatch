// portwatch-hooks.js — lifecycle hooks for portwatch scan events

const path = require('path');
const fs = require('fs');
const { getConfigDir } = require('./config');

const HOOKS_FILE = 'hooks.json';

function getHooksPath() {
  return path.join(getConfigDir(), HOOKS_FILE);
}

function loadHooks() {
  const p = getHooksPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveHooks(hooks) {
  fs.writeFileSync(getHooksPath(), JSON.stringify(hooks, null, 2));
}

function addHook(event, command) {
  const hooks = loadHooks();
  if (!hooks[event]) hooks[event] = [];
  if (!hooks[event].includes(command)) {
    hooks[event].push(command);
  }
  saveHooks(hooks);
  return hooks;
}

function removeHook(event, command) {
  const hooks = loadHooks();
  if (!hooks[event]) return hooks;
  hooks[event] = hooks[event].filter(c => c !== command);
  if (hooks[event].length === 0) delete hooks[event];
  saveHooks(hooks);
  return hooks;
}

function getHooks(event) {
  const hooks = loadHooks();
  return hooks[event] || [];
}

function clearHooks(event) {
  const hooks = loadHooks();
  if (event) {
    delete hooks[event];
  } else {
    Object.keys(hooks).forEach(k => delete hooks[k]);
  }
  saveHooks(hooks);
  return hooks;
}

const VALID_EVENTS = ['on-scan', 'on-change', 'on-open', 'on-close', 'on-start', 'on-stop'];

function isValidEvent(event) {
  return VALID_EVENTS.includes(event);
}

module.exports = {
  getHooksPath,
  loadHooks,
  saveHooks,
  addHook,
  removeHook,
  getHooks,
  clearHooks,
  isValidEvent,
  VALID_EVENTS,
};
