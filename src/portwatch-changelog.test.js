const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const {
  getChangelogPath,
  loadChangelog,
  saveChangelog,
  appendChangelogEntry,
  getRecentChanges,
  clearChangelog,
  formatChangelogEntry
} = require('./portwatch-changelog');

const MOCK_PATH = path.join(os.homedir(), '.portwatch', 'changelog.json');

const sampleDiff = {
  added: [{ port: 3000, protocol: 'tcp', process: 'node' }],
  removed: [{ port: 8080, protocol: 'tcp', process: 'python' }],
  changed: []
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
});

test('getChangelogPath returns expected path', () => {
  expect(getChangelogPath()).toBe(MOCK_PATH);
});

test('loadChangelog returns empty array when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(loadChangelog()).toEqual([]);
});

test('loadChangelog parses existing file', () => {
  const data = [{ id: 'abc', timestamp: '2024-01-01T00:00:00.000Z', added: [], removed: [], changed: [] }];
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
  expect(loadChangelog()).toEqual(data);
});

test('saveChangelog writes JSON to disk', () => {
  fs.existsSync.mockReturnValue(true);
  saveChangelog([{ id: 'x' }]);
  expect(fs.writeFileSync).toHaveBeenCalled();
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written[0].id).toBe('x');
});

test('appendChangelogEntry adds entry with correct fields', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('[]');
  const entry = appendChangelogEntry(sampleDiff, 'test-label');
  expect(entry.label).toBe('test-label');
  expect(entry.added).toHaveLength(1);
  expect(entry.removed).toHaveLength(1);
  expect(entry.changed).toHaveLength(0);
  expect(entry.timestamp).toBeDefined();
});

test('getRecentChanges returns last N entries reversed', () => {
  const data = Array.from({ length: 15 }, (_, i) => ({ id: String(i), added: [], removed: [], changed: [] }));
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
  const recent = getRecentChanges(5);
  expect(recent).toHaveLength(5);
  expect(recent[0].id).toBe('14');
});

test('clearChangelog writes empty array', () => {
  fs.existsSync.mockReturnValue(true);
  clearChangelog();
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written).toEqual([]);
});

test('formatChangelogEntry formats correctly', () => {
  const entry = {
    id: 'abc123',
    timestamp: '2024-06-01T12:00:00.000Z',
    label: 'scan-1',
    added: [{ port: 3000, protocol: 'tcp' }],
    removed: [],
    changed: [{ port: 9090, protocol: 'udp' }]
  };
  const out = formatChangelogEntry(entry);
  expect(out).toContain('scan-1');
  expect(out).toContain('3000/tcp');
  expect(out).toContain('9090/udp');
  expect(out).not.toContain('removed');
});
