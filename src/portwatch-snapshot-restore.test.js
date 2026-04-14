const {
  findSnapshotByIndex,
  findSnapshotByTimestamp,
  restoreSnapshot,
  formatRestoreResult,
  loadRestoreLog,
  saveRestoreLog
} = require('./portwatch-snapshot-restore');
const fs = require('fs');
const path = require('path');
const os = require('os');

const makeEntry = (ts, ports) => ({ timestamp: ts, ports });

describe('findSnapshotByIndex', () => {
  const history = [
    makeEntry('2024-01-01T00:00:00Z', [{ port: 3000 }]),
    makeEntry('2024-01-02T00:00:00Z', [{ port: 4000 }]),
    makeEntry('2024-01-03T00:00:00Z', [{ port: 5000 }])
  ];

  test('finds by positive index', () => {
    expect(findSnapshotByIndex(history, 0).timestamp).toBe('2024-01-01T00:00:00Z');
    expect(findSnapshotByIndex(history, 2).timestamp).toBe('2024-01-03T00:00:00Z');
  });

  test('finds by negative index', () => {
    expect(findSnapshotByIndex(history, -1).timestamp).toBe('2024-01-03T00:00:00Z');
    expect(findSnapshotByIndex(history, -2).timestamp).toBe('2024-01-02T00:00:00Z');
  });

  test('returns null for empty history', () => {
    expect(findSnapshotByIndex([], 0)).toBeNull();
    expect(findSnapshotByIndex(null, 0)).toBeNull();
  });

  test('returns null for out-of-range index', () => {
    expect(findSnapshotByIndex(history, 10)).toBeNull();
  });
});

describe('findSnapshotByTimestamp', () => {
  const history = [
    makeEntry('2024-01-01T10:00:00Z', []),
    makeEntry('2024-01-02T10:00:00Z', [])
  ];

  test('finds by full timestamp', () => {
    expect(findSnapshotByTimestamp(history, '2024-01-01T10:00:00Z')).not.toBeNull();
  });

  test('finds by partial timestamp prefix', () => {
    expect(findSnapshotByTimestamp(history, '2024-01-02')).not.toBeNull();
  });

  test('returns undefined for no match', () => {
    expect(findSnapshotByTimestamp(history, '1999-01-01')).toBeUndefined();
  });
});

describe('restoreSnapshot', () => {
  test('dry run does not throw and returns result', () => {
    const entry = makeEntry('2024-01-01T00:00:00Z', [{ port: 8080 }]);
    const result = restoreSnapshot(entry, { dry: true, label: 'test' });
    expect(result.dry).toBe(true);
    expect(result.ports).toHaveLength(1);
  });

  test('throws on invalid entry', () => {
    expect(() => restoreSnapshot(null)).toThrow();
    expect(() => restoreSnapshot({})).toThrow();
  });
});

describe('formatRestoreResult', () => {
  test('formats normal result', () => {
    const r = { dry: false, timestamp: '2024-01-01T00:00:00Z', ports: [1, 2], label: 'main' };
    expect(formatRestoreResult(r)).toMatch(/Restored snapshot from/);
    expect(formatRestoreResult(r)).toMatch('main');
  });

  test('prefixes dry-run', () => {
    const r = { dry: true, timestamp: '2024-01-01T00:00:00Z', ports: [], label: 'x' };
    expect(formatRestoreResult(r)).toMatch('[dry-run]');
  });
});
