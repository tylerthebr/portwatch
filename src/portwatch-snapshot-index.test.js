const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  getIndexPath,
  loadIndex,
  saveIndex,
  buildIndex,
  rebuildIndex,
  findByLabel,
  findByTag,
  findByDate,
} = require('./portwatch-snapshot-index');

jest.mock('./history');
const { loadHistory } = require('./history');

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-idx-'));
  jest.clearAllMocks();
});
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

test('getIndexPath returns correct path', () => {
  expect(getIndexPath(tmpDir)).toBe(path.join(tmpDir, 'snapshot-index.json'));
});

test('loadIndex returns empty array when file missing', () => {
  expect(loadIndex(tmpDir)).toEqual([]);
});

test('saveIndex and loadIndex round-trip', () => {
  const entries = [{ index: 0, timestamp: '2024-01-01T00:00:00Z', portCount: 3, label: null, tag: null }];
  saveIndex(entries, tmpDir);
  expect(loadIndex(tmpDir)).toEqual(entries);
});

test('buildIndex maps history entries', () => {
  loadHistory.mockReturnValue([
    { timestamp: '2024-01-01T10:00:00Z', ports: [1, 2, 3], label: 'alpha', tag: 'v1' },
    { timestamp: '2024-01-02T10:00:00Z', ports: [], label: null, tag: null },
  ]);
  const idx = buildIndex(tmpDir);
  expect(idx).toHaveLength(2);
  expect(idx[0]).toMatchObject({ index: 0, portCount: 3, label: 'alpha', tag: 'v1' });
  expect(idx[1]).toMatchObject({ index: 1, portCount: 0, label: null, tag: null });
});

test('rebuildIndex saves and returns index', () => {
  loadHistory.mockReturnValue([{ timestamp: '2024-03-01T00:00:00Z', ports: [80], label: 'main', tag: null }]);
  const result = rebuildIndex(tmpDir);
  expect(result).toHaveLength(1);
  expect(loadIndex(tmpDir)).toHaveLength(1);
});

test('findByLabel filters correctly', () => {
  saveIndex([
    { index: 0, timestamp: 't1', portCount: 1, label: 'dev', tag: null },
    { index: 1, timestamp: 't2', portCount: 2, label: 'prod', tag: null },
  ], tmpDir);
  expect(findByLabel('dev', tmpDir)).toHaveLength(1);
  expect(findByLabel('prod', tmpDir)[0].index).toBe(1);
});

test('findByTag filters correctly', () => {
  saveIndex([
    { index: 0, timestamp: 't1', portCount: 1, label: null, tag: 'stable' },
    { index: 1, timestamp: 't2', portCount: 2, label: null, tag: 'nightly' },
  ], tmpDir);
  expect(findByTag('stable', tmpDir)).toHaveLength(1);
});

test('findByDate filters by date prefix', () => {
  saveIndex([
    { index: 0, timestamp: '2024-06-01T08:00:00Z', portCount: 2, label: null, tag: null },
    { index: 1, timestamp: '2024-06-02T08:00:00Z', portCount: 3, label: null, tag: null },
  ], tmpDir);
  expect(findByDate('2024-06-01', tmpDir)).toHaveLength(1);
  expect(findByDate('2024-06', tmpDir)).toHaveLength(2);
});
