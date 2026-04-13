const fs = require('fs');
const path = require('path');
const {
  loadArchive,
  saveArchive,
  archiveHistory,
  getArchiveById,
  removeArchive,
  clearArchive,
  formatArchiveList
} = require('./portwatch-archive');

jest.mock('fs');
jest.mock('./config', () => ({ ensureConfigDir: () => '/mock/.portwatch' }));
jest.mock('./history', () => ({
  loadHistory: () => [
    { port: 3000, process: 'node', protocol: 'tcp' },
    { port: 5432, process: 'postgres', protocol: 'tcp' }
  ]
}));

const ARCHIVE_PATH = '/mock/.portwatch/archive.json';

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.readFileSync.mockReturnValue('[]');
  fs.writeFileSync.mockReset();
});

test('loadArchive returns empty array when file missing', () => {
  expect(loadArchive()).toEqual([]);
});

test('loadArchive parses existing file', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify([{ id: 'archive-1', label: 'Test' }]));
  const result = loadArchive();
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('archive-1');
});

test('saveArchive writes JSON to disk', () => {
  const entries = [{ id: 'archive-2', label: 'Save test' }];
  saveArchive(entries);
  expect(fs.writeFileSync).toHaveBeenCalledWith(ARCHIVE_PATH, JSON.stringify(entries, null, 2));
});

test('archiveHistory creates an archive entry', () => {
  fs.existsSync.mockReturnValue(false);
  const entry = archiveHistory('my label');
  expect(entry).not.toBeNull();
  expect(entry.label).toBe('my label');
  expect(entry.entryCount).toBe(2);
  expect(entry.snapshot).toHaveLength(2);
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('getArchiveById finds entry by id', () => {
  const mock = [{ id: 'archive-42', label: 'find me', entryCount: 1, snapshot: [] }];
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(mock));
  expect(getArchiveById('archive-42').label).toBe('find me');
  expect(getArchiveById('nope')).toBeNull();
});

test('removeArchive filters out entry', () => {
  const mock = [{ id: 'a1' }, { id: 'a2' }];
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(mock));
  const result = removeArchive('a1');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('a2');
});

test('clearArchive writes empty array', () => {
  clearArchive();
  expect(fs.writeFileSync).toHaveBeenCalledWith(ARCHIVE_PATH, '[]');
});

test('formatArchiveList returns readable string', () => {
  const list = [{ id: 'arc-1', label: 'Alpha', entryCount: 5, createdAt: '2024-01-01T00:00:00.000Z' }];
  const out = formatArchiveList(list);
  expect(out).toContain('arc-1');
  expect(out).toContain('Alpha');
  expect(out).toContain('5 entries');
});

test('formatArchiveList handles empty', () => {
  expect(formatArchiveList([])).toBe('No archived snapshots.');
});
