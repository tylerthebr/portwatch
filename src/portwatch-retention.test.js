const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('fs');

const {
  getRetentionPath,
  loadRetentionPolicy,
  saveRetentionPolicy,
  getDefaultPolicy,
  applyRetention,
  buildRetentionReport,
  formatRetentionReport
} = require('./portwatch-retention');

const DEFAULT_PATH = path.join(os.homedir(), '.portwatch', 'retention.json');

beforeEach(() => jest.clearAllMocks());

test('getRetentionPath returns expected path', () => {
  expect(getRetentionPath()).toBe(DEFAULT_PATH);
});

test('getDefaultPolicy returns sensible defaults', () => {
  const p = getDefaultPolicy();
  expect(p.maxAgeDays).toBe(30);
  expect(p.maxEntries).toBe(500);
  expect(p.keepTagged).toBe(true);
});

test('loadRetentionPolicy returns default when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(loadRetentionPolicy()).toEqual(getDefaultPolicy());
});

test('loadRetentionPolicy reads and parses file', () => {
  const policy = { maxAgeDays: 7, maxEntries: 100, keepTagged: false };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(policy));
  expect(loadRetentionPolicy()).toEqual(policy);
});

test('saveRetentionPolicy writes JSON to disk', () => {
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  const policy = { maxAgeDays: 14, maxEntries: 200, keepTagged: true };
  saveRetentionPolicy(policy);
  expect(fs.writeFileSync).toHaveBeenCalledWith(DEFAULT_PATH, JSON.stringify(policy, null, 2));
});

test('applyRetention removes old entries', () => {
  const policy = { maxAgeDays: 1, maxEntries: 500, keepTagged: true };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(policy));

  const old = { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() };
  const fresh = { timestamp: new Date().toISOString() };
  const result = applyRetention([old, fresh]);
  expect(result).toEqual([fresh]);
});

test('applyRetention keeps tagged entries regardless of age', () => {
  const policy = { maxAgeDays: 1, maxEntries: 500, keepTagged: true };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(policy));

  const old = { id: 'abc', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() };
  const result = applyRetention([old], new Set(['abc']));
  expect(result).toHaveLength(1);
});

test('applyRetention trims to maxEntries', () => {
  const policy = { maxAgeDays: 9999, maxEntries: 2, keepTagged: false };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(policy));

  const entries = [1, 2, 3, 4].map(i => ({ id: String(i), timestamp: new Date().toISOString() }));
  const result = applyRetention(entries);
  expect(result).toHaveLength(2);
});

test('buildRetentionReport calculates removed count', () => {
  fs.existsSync.mockReturnValue(false);
  const before = [{}, {}, {}];
  const after = [{}];
  const report = buildRetentionReport(before, after);
  expect(report.removed).toBe(2);
  expect(report.before).toBe(3);
  expect(report.after).toBe(1);
});

test('formatRetentionReport returns readable string', () => {
  fs.existsSync.mockReturnValue(false);
  const report = buildRetentionReport([{}, {}], [{}]);
  const out = formatRetentionReport(report);
  expect(out).toContain('Removed: 1');
  expect(out).toContain('Max age');
});
