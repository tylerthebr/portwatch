const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const LOCK_FILE = path.join(os.homedir(), '.portwatch', 'portlock.json');

const {
  loadLocks,
  saveLocks,
  lockPort,
  unlockPort,
  isLocked,
  getLock,
  clearLocks,
  auditAgainstLocks,
} = require('./portlock');

beforeEach(() => {
  jest.resetAllMocks();
  fs.existsSync.mockReturnValue(false);
});

test('loadLocks returns empty object when file missing', () => {
  expect(loadLocks()).toEqual({});
});

test('loadLocks parses existing file', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ 3000: { port: 3000, note: 'dev' } }));
  expect(loadLocks()).toEqual({ 3000: { port: 3000, note: 'dev' } });
});

test('lockPort saves a new lock entry', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('{}');
  const result = lockPort(3000, { note: 'api server', process: 'node' });
  expect(result.port).toBe(3000);
  expect(result.note).toBe('api server');
  expect(result.process).toBe('node');
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('unlockPort removes an existing lock', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ 3000: { port: 3000 } }));
  const existed = unlockPort(3000);
  expect(existed).toBe(true);
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('unlockPort returns false for unknown port', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('{}');
  expect(unlockPort(9999)).toBe(false);
});

test('isLocked returns true when port is locked', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ 8080: { port: 8080 } }));
  expect(isLocked(8080)).toBe(true);
});

test('getLock returns null for unlocked port', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('{}');
  expect(getLock(1234)).toBeNull();
});

test('clearLocks writes empty object', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('{}');
  clearLocks();
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written).toEqual({});
});

test('auditAgainstLocks detects missing port', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ 3000: { port: 3000, process: 'node' } }));
  const violations = auditAgainstLocks([]);
  expect(violations).toHaveLength(1);
  expect(violations[0].type).toBe('missing');
});

test('auditAgainstLocks detects process mismatch', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ 3000: { port: 3000, process: 'node' } }));
  const violations = auditAgainstLocks([{ port: 3000, process: 'python' }]);
  expect(violations).toHaveLength(1);
  expect(violations[0].type).toBe('process_mismatch');
  expect(violations[0].actual).toBe('python');
});

test('auditAgainstLocks returns no violations when all match', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ 3000: { port: 3000, process: 'node' } }));
  const violations = auditAgainstLocks([{ port: 3000, process: 'node' }]);
  expect(violations).toHaveLength(0);
});
