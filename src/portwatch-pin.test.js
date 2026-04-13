const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir,
}));

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-pin-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
  return require('./portwatch-pin');
}

test('pinPort adds a pin entry', () => {
  const { pinPort, loadPins } = load();
  pinPort(3000, 'dev server');
  const pins = loadPins();
  expect(pins['3000']).toMatchObject({ port: 3000, label: 'dev server' });
  expect(pins['3000'].pinnedAt).toBeTruthy();
});

test('unpinPort removes a pin', () => {
  const { pinPort, unpinPort, isPinned } = load();
  pinPort(4000);
  expect(isPinned(4000)).toBe(true);
  const removed = unpinPort(4000);
  expect(removed).toBe(true);
  expect(isPinned(4000)).toBe(false);
});

test('unpinPort returns false for unknown port', () => {
  const { unpinPort } = load();
  expect(unpinPort(9999)).toBe(false);
});

test('listPins returns all pins', () => {
  const { pinPort, listPins } = load();
  pinPort(3000); pinPort(5000);
  const list = listPins();
  expect(list).toHaveLength(2);
  expect(list.map(p => p.port)).toEqual(expect.arrayContaining([3000, 5000]));
});

test('clearPins removes all pins', () => {
  const { pinPort, clearPins, listPins } = load();
  pinPort(3000); pinPort(4000);
  clearPins();
  expect(listPins()).toHaveLength(0);
});

test('filterPinned returns only pinned entries', () => {
  const { pinPort, filterPinned } = load();
  pinPort(3000);
  const entries = [{ port: 3000 }, { port: 4000 }, { port: 5000 }];
  const result = filterPinned(entries);
  expect(result).toHaveLength(1);
  expect(result[0].port).toBe(3000);
});

test('loadPins returns empty object when no file', () => {
  const { loadPins } = load();
  expect(loadPins()).toEqual({});
});
