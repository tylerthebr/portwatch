const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const {
  loadShadowLog,
  saveShadowLog,
  recordShadow,
  getShadowEntries,
  pruneShadowLog,
  detectShadows,
  formatShadowEntry
} = require('./portwatch-shadow');

const mockLog = [];

beforeEach(() => {
  mockLog.length = 0;
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockImplementation(() => JSON.stringify(mockLog));
  fs.writeFileSync.mockImplementation((_, data) => {
    const parsed = JSON.parse(data);
    mockLog.length = 0;
    parsed.forEach(e => mockLog.push(e));
  });
  fs.mkdirSync.mockImplementation(() => {});
});

test('loadShadowLog returns empty array when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(loadShadowLog()).toEqual([]);
});

test('recordShadow adds a new entry', () => {
  fs.readFileSync.mockReturnValue('[]');
  recordShadow({ port: 3000, protocol: 'tcp', process: 'node' });
  expect(mockLog).toHaveLength(1);
  expect(mockLog[0].port).toBe(3000);
  expect(mockLog[0].seenCount).toBe(1);
});

test('recordShadow increments seenCount for existing entry', () => {
  const now = Date.now();
  mockLog.push({ port: 3000, protocol: 'tcp', process: 'node', firstSeen: now, lastSeen: now, seenCount: 1 });
  recordShadow({ port: 3000, protocol: 'tcp', process: 'node' });
  expect(mockLog[0].seenCount).toBe(2);
});

test('getShadowEntries filters by TTL', () => {
  const now = Date.now();
  mockLog.push({ port: 8080, protocol: 'tcp', lastSeen: now - 100 });
  mockLog.push({ port: 9090, protocol: 'tcp', lastSeen: now - 99999 });
  const result = getShadowEntries(5000);
  expect(result).toHaveLength(1);
  expect(result[0].port).toBe(8080);
});

test('pruneShadowLog removes stale entries and returns count', () => {
  const now = Date.now();
  mockLog.push({ port: 1111, protocol: 'tcp', lastSeen: now - 1000 });
  mockLog.push({ port: 2222, protocol: 'tcp', lastSeen: now - 99999 });
  const removed = pruneShadowLog(5000);
  expect(removed).toBe(1);
  expect(mockLog).toHaveLength(1);
  expect(mockLog[0].port).toBe(1111);
});

test('detectShadows finds ports in previous but not current', () => {
  const prev = [{ port: 3000, protocol: 'tcp' }, { port: 4000, protocol: 'tcp' }];
  const curr = [{ port: 4000, protocol: 'tcp' }];
  const shadows = detectShadows(prev, curr);
  expect(shadows).toHaveLength(1);
  expect(shadows[0].port).toBe(3000);
});

test('formatShadowEntry returns readable string', () => {
  const entry = { port: 5000, protocol: 'tcp', process: 'python', seenCount: 3, firstSeen: Date.now() - 2000, lastSeen: Date.now() };
  const out = formatShadowEntry(entry);
  expect(out).toMatch('[SHADOW]');
  expect(out).toMatch('port=5000');
  expect(out).toMatch('seen=3x');
});
