const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const MEMO_FILE = path.join(os.homedir(), '.portwatch', 'memos.json');

const {
  setMemo, getMemo, removeMemo, clearMemos, listMemos, annotateMemo, getMemoPath,
} = require('./portmemo');

const mockMemos = {
  '3000': { note: 'dev server', updatedAt: '2024-01-01T00:00:00.000Z' },
  '5432': { note: 'postgres', updatedAt: '2024-01-02T00:00:00.000Z' },
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(mockMemos));
  fs.writeFileSync.mockImplementation(() => {});
  fs.mkdirSync.mockImplementation(() => {});
});

test('getMemoPath returns expected path', () => {
  expect(getMemoPath()).toBe(MEMO_FILE);
});

test('getMemo returns memo for known port', () => {
  const result = getMemo(3000);
  expect(result).toEqual({ note: 'dev server', updatedAt: '2024-01-01T00:00:00.000Z' });
});

test('getMemo returns null for unknown port', () => {
  expect(getMemo(9999)).toBeNull();
});

test('setMemo writes updated memos', () => {
  const result = setMemo(8080, 'proxy');
  expect(result.note).toBe('proxy');
  expect(result.updatedAt).toBeDefined();
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('setMemo throws if port or note missing', () => {
  expect(() => setMemo(null, 'note')).toThrow();
  expect(() => setMemo(3000, 123)).toThrow();
});

test('removeMemo deletes existing entry and returns true', () => {
  const removed = removeMemo(3000);
  expect(removed).toBe(true);
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('removeMemo returns false for unknown port', () => {
  const removed = removeMemo(9999);
  expect(removed).toBe(false);
  expect(fs.writeFileSync).not.toHaveBeenCalled();
});

test('clearMemos writes empty object', () => {
  clearMemos();
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written).toEqual({});
});

test('listMemos returns array with port as number', () => {
  const list = listMemos();
  expect(Array.isArray(list)).toBe(true);
  expect(list[0].port).toBe(3000);
  expect(list[0].note).toBe('dev server');
});

test('annotateMemo adds memo field to entry', () => {
  const entry = { port: 3000, pid: 123 };
  const annotated = annotateMemo(entry);
  expect(annotated.memo).toBe('dev server');
});

test('annotateMemo returns entry unchanged if no memo', () => {
  const entry = { port: 9999, pid: 42 };
  const annotated = annotateMemo(entry);
  expect(annotated.memo).toBeUndefined();
});

test('annotateMemo handles null entry gracefully', () => {
  expect(annotateMemo(null)).toBeNull();
});
