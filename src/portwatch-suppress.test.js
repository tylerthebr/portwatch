const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir,
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-suppress-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
  return require('./portwatch-suppress');
}

test('loadSuppressions returns empty array when no file', () => {
  const { loadSuppressions } = load();
  expect(loadSuppressions()).toEqual([]);
});

test('addSuppression persists a rule', () => {
  const { addSuppression, loadSuppressions } = load();
  const added = addSuppression({ port: 3000, reason: 'dev server' });
  expect(added).toBe(true);
  const list = loadSuppressions();
  expect(list).toHaveLength(1);
  expect(list[0].port).toBe(3000);
  expect(list[0].reason).toBe('dev server');
  expect(list[0].createdAt).toBeDefined();
});

test('addSuppression prevents duplicates', () => {
  const { addSuppression, loadSuppressions } = load();
  addSuppression({ port: 3000, reason: 'dev server' });
  const added = addSuppression({ port: 3000, reason: 'dev server' });
  expect(added).toBe(false);
  expect(loadSuppressions()).toHaveLength(1);
});

test('removeSuppression removes a rule by port', () => {
  const { addSuppression, removeSuppression, loadSuppressions } = load();
  addSuppression({ port: 8080, reason: 'test' });
  const removed = removeSuppression(8080);
  expect(removed).toBe(true);
  expect(loadSuppressions()).toHaveLength(0);
});

test('isSuppressed returns true for exact port match', () => {
  const { addSuppression, isSuppressed } = load();
  addSuppression({ port: 5432, reason: 'postgres' });
  expect(isSuppressed(5432)).toBe(true);
  expect(isSuppressed(5433)).toBe(false);
});

test('isSuppressed handles range rules', () => {
  const { addSuppression, isSuppressed } = load();
  addSuppression({ port: '3000-3010', reason: 'dev range' });
  expect(isSuppressed(3005)).toBe(true);
  expect(isSuppressed(3011)).toBe(false);
});

test('applySuppressions filters out suppressed entries', () => {
  const { addSuppression, applySuppressions } = load();
  addSuppression({ port: 3000, reason: 'noise' });
  const entries = [
    { port: 3000, process: 'node' },
    { port: 8080, process: 'nginx' },
  ];
  const result = applySuppressions(entries);
  expect(result).toHaveLength(1);
  expect(result[0].port).toBe(8080);
});

test('clearSuppressions empties the list', () => {
  const { addSuppression, clearSuppressions, loadSuppressions } = load();
  addSuppression({ port: 9000, reason: 'temp' });
  clearSuppressions();
  expect(loadSuppressions()).toHaveLength(0);
});
