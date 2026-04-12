const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  getConfigDir: () => tmpDir,
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-hooks-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  return require('./portwatch-hooks');
}

test('loadHooks returns empty object when no file exists', () => {
  const { loadHooks } = load();
  expect(loadHooks()).toEqual({});
});

test('addHook creates entry for event', () => {
  const { addHook, getHooks } = load();
  addHook('on-scan', 'echo scan done');
  expect(getHooks('on-scan')).toEqual(['echo scan done']);
});

test('addHook does not duplicate commands', () => {
  const { addHook, getHooks } = load();
  addHook('on-scan', 'echo hi');
  addHook('on-scan', 'echo hi');
  expect(getHooks('on-scan')).toHaveLength(1);
});

test('addHook supports multiple events', () => {
  const { addHook, loadHooks } = load();
  addHook('on-open', 'notify-send opened');
  addHook('on-close', 'notify-send closed');
  const hooks = loadHooks();
  expect(hooks['on-open']).toContain('notify-send opened');
  expect(hooks['on-close']).toContain('notify-send closed');
});

test('removeHook removes specific command', () => {
  const { addHook, removeHook, getHooks } = load();
  addHook('on-change', 'cmd1');
  addHook('on-change', 'cmd2');
  removeHook('on-change', 'cmd1');
  expect(getHooks('on-change')).toEqual(['cmd2']);
});

test('removeHook removes event key when empty', () => {
  const { addHook, removeHook, loadHooks } = load();
  addHook('on-stop', 'cleanup');
  removeHook('on-stop', 'cleanup');
  expect(loadHooks()['on-stop']).toBeUndefined();
});

test('clearHooks removes specific event', () => {
  const { addHook, clearHooks, loadHooks } = load();
  addHook('on-start', 'init');
  addHook('on-stop', 'teardown');
  clearHooks('on-start');
  const hooks = loadHooks();
  expect(hooks['on-start']).toBeUndefined();
  expect(hooks['on-stop']).toBeDefined();
});

test('clearHooks with no arg clears all', () => {
  const { addHook, clearHooks, loadHooks } = load();
  addHook('on-scan', 'a');
  addHook('on-open', 'b');
  clearHooks();
  expect(loadHooks()).toEqual({});
});

test('isValidEvent returns true for known events', () => {
  const { isValidEvent, VALID_EVENTS } = load();
  VALID_EVENTS.forEach(e => expect(isValidEvent(e)).toBe(true));
});

test('isValidEvent returns false for unknown event', () => {
  const { isValidEvent } = load();
  expect(isValidEvent('on-explode')).toBe(false);
});
