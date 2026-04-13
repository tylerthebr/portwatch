const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-snaptag-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  return require('./portwatch-snapshot-tag');
}

test('loadSnapshotTags returns empty object when no file', () => {
  const { loadSnapshotTags } = load();
  expect(loadSnapshotTags()).toEqual({});
});

test('tagSnapshot stores a tag with snapshotId and timestamp', () => {
  const { tagSnapshot, loadSnapshotTags } = load();
  const result = tagSnapshot('v1', 'snap-001');
  expect(result.snapshotId).toBe('snap-001');
  expect(result.taggedAt).toBeDefined();
  const tags = loadSnapshotTags();
  expect(tags['v1'].snapshotId).toBe('snap-001');
});

test('tagSnapshot throws if tag or snapshotId missing', () => {
  const { tagSnapshot } = load();
  expect(() => tagSnapshot('', 'snap-001')).toThrow();
  expect(() => tagSnapshot('v1', '')).toThrow();
});

test('getSnapshotIdByTag returns correct id', () => {
  const { tagSnapshot, getSnapshotIdByTag } = load();
  tagSnapshot('prod', 'snap-999');
  expect(getSnapshotIdByTag('prod')).toBe('snap-999');
});

test('getSnapshotIdByTag returns null for unknown tag', () => {
  const { getSnapshotIdByTag } = load();
  expect(getSnapshotIdByTag('nope')).toBeNull();
});

test('untagSnapshot removes an existing tag', () => {
  const { tagSnapshot, untagSnapshot, loadSnapshotTags } = load();
  tagSnapshot('beta', 'snap-042');
  const removed = untagSnapshot('beta');
  expect(removed).toBe(true);
  expect(loadSnapshotTags()['beta']).toBeUndefined();
});

test('untagSnapshot returns false for unknown tag', () => {
  const { untagSnapshot } = load();
  expect(untagSnapshot('ghost')).toBe(false);
});

test('listSnapshotTags returns all tags', () => {
  const { tagSnapshot, listSnapshotTags } = load();
  tagSnapshot('a', 'snap-1');
  tagSnapshot('b', 'snap-2');
  const list = listSnapshotTags();
  expect(Object.keys(list)).toHaveLength(2);
});

test('clearSnapshotTags empties all tags', () => {
  const { tagSnapshot, clearSnapshotTags, loadSnapshotTags } = load();
  tagSnapshot('x', 'snap-x');
  clearSnapshotTags();
  expect(loadSnapshotTags()).toEqual({});
});
