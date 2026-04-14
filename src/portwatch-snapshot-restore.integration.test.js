const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  getRestorePath,
  loadRestoreLog,
  saveRestoreLog,
  restoreSnapshot,
  findSnapshotByIndex,
  findSnapshotByTimestamp
} = require('./portwatch-snapshot-restore');

const RESTORE_PATH = getRestorePath();

beforeEach(() => {
  if (fs.existsSync(RESTORE_PATH)) fs.unlinkSync(RESTORE_PATH);
});

afterEach(() => {
  if (fs.existsSync(RESTORE_PATH)) fs.unlinkSync(RESTORE_PATH);
});

const sampleHistory = [
  { timestamp: '2024-01-10T08:00:00Z', ports: [{ port: 3000, process: 'node' }] },
  { timestamp: '2024-01-11T09:00:00Z', ports: [{ port: 4000, process: 'python' }] },
  { timestamp: '2024-01-12T10:00:00Z', ports: [{ port: 5000, process: 'ruby' }] }
];

test('restore log is empty initially', () => {
  expect(loadRestoreLog()).toEqual([]);
});

test('saveRestoreLog and loadRestoreLog round-trip', () => {
  const log = [{ restoredAt: '2024-01-13T00:00:00Z', from: '2024-01-10T08:00:00Z', label: 'test' }];
  saveRestoreLog(log);
  expect(loadRestoreLog()).toEqual(log);
});

test('restoreSnapshot (dry) does not write to restore log', () => {
  const entry = sampleHistory[0];
  restoreSnapshot(entry, { dry: true });
  expect(loadRestoreLog()).toEqual([]);
});

test('restoreSnapshot appends to restore log', () => {
  const entry = sampleHistory[1];
  restoreSnapshot(entry, { label: 'integration-test' });
  const log = loadRestoreLog();
  expect(log).toHaveLength(1);
  expect(log[0].label).toBe('integration-test');
  expect(log[0].from).toBe('2024-01-11T09:00:00Z');
});

test('multiple restores accumulate in log', () => {
  restoreSnapshot(sampleHistory[0], { label: 'first' });
  restoreSnapshot(sampleHistory[2], { label: 'second' });
  const log = loadRestoreLog();
  expect(log).toHaveLength(2);
  expect(log[0].label).toBe('first');
  expect(log[1].label).toBe('second');
});

test('findSnapshotByTimestamp finds correct entry in real history', () => {
  const found = findSnapshotByTimestamp(sampleHistory, '2024-01-11');
  expect(found).not.toBeNull();
  expect(found.ports[0].process).toBe('python');
});

test('findSnapshotByIndex(-1) returns last entry', () => {
  const found = findSnapshotByIndex(sampleHistory, -1);
  expect(found.ports[0].port).toBe(5000);
});
