const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const SCOPE_DIR = path.join(os.homedir(), '.portwatch', 'scopes');

const { listScopes, loadScope, saveScope, removeScope, diffScopes } = require('./portscope');

const mockEntries = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' },
];

beforeEach(() => {
  fs.existsSync.mockReturnValue(true);
  fs.mkdirSync.mockImplementation(() => {});
});

test('listScopes returns scope names from dir', () => {
  fs.readdirSync.mockReturnValue(['dev.json', 'staging.json', 'notes.txt']);
  expect(listScopes()).toEqual(['dev', 'staging']);
});

test('loadScope returns null if file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(loadScope('dev')).toBeNull();
});

test('loadScope returns parsed data', () => {
  const data = { name: 'dev', savedAt: '2024-01-01T00:00:00Z', entries: mockEntries };
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
  expect(loadScope('dev')).toEqual(data);
});

test('saveScope writes scope file and returns data', () => {
  fs.writeFileSync.mockImplementation(() => {});
  const result = saveScope('dev', mockEntries);
  expect(result.name).toBe('dev');
  expect(result.entries).toEqual(mockEntries);
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('removeScope returns true when file exists', () => {
  fs.unlinkSync.mockImplementation(() => {});
  expect(removeScope('dev')).toBe(true);
});

test('removeScope returns false when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(removeScope('ghost')).toBe(false);
});

test('diffScopes identifies added and removed entries', () => {
  const scopeA = { entries: [{ port: 3000, protocol: 'tcp' }] };
  const scopeB = { entries: [{ port: 3000, protocol: 'tcp' }, { port: 8080, protocol: 'tcp' }] };
  fs.readFileSync
    .mockReturnValueOnce(JSON.stringify(scopeA))
    .mockReturnValueOnce(JSON.stringify(scopeB));
  const diff = diffScopes('dev', 'staging');
  expect(diff.added).toHaveLength(1);
  expect(diff.added[0].port).toBe(8080);
  expect(diff.removed).toHaveLength(0);
});

test('diffScopes throws if scope not found', () => {
  fs.existsSync.mockReturnValue(false);
  expect(() => diffScopes('x', 'y')).toThrow('Scope not found');
});
