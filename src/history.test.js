const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  loadConfig: () => ({ configDir: require('os').tmpdir() }),
}));

const { loadHistory, saveHistory, appendHistoryEntry, clearHistory, getRecentHistory } = require('./history');

const historyPath = path.join(os.tmpdir(), 'history.json');

beforeEach(() => {
  if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
});

afterEach(() => {
  if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
});

test('loadHistory returns empty array when no file exists', () => {
  expect(loadHistory()).toEqual([]);
});

test('saveHistory and loadHistory round-trip', () => {
  const entries = [{ timestamp: '2024-01-01T00:00:00.000Z', added: [{ port: 3000 }], removed: [] }];
  saveHistory(entries);
  expect(loadHistory()).toEqual(entries);
});

test('appendHistoryEntry adds an entry', () => {
  const diff = { added: [{ port: 8080, pid: 1234, process: 'node' }], removed: [] };
  appendHistoryEntry(diff);
  const history = loadHistory();
  expect(history).toHaveLength(1);
  expect(history[0].added).toEqual(diff.added);
  expect(history[0].timestamp).toBeDefined();
});

test('appendHistoryEntry does nothing for empty diff', () => {
  appendHistoryEntry({ added: [], removed: [] });
  expect(loadHistory()).toHaveLength(0);
});

test('getRecentHistory respects limit', () => {
  const entries = Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(i * 1000).toISOString(),
    added: [{ port: 3000 + i }],
    removed: [],
  }));
  saveHistory(entries);
  expect(getRecentHistory(5)).toHaveLength(5);
});

test('clearHistory removes the file', () => {
  saveHistory([{ timestamp: 'x', added: [], removed: [] }]);
  clearHistory();
  expect(fs.existsSync(historyPath)).toBe(false);
});
