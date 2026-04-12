const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const SESSION_DIR = path.join(os.homedir(), '.portwatch', 'sessions');

const {
  createSession,
  loadSession,
  saveSession,
  endSession,
  appendSnapshot,
  listSessions,
  clearSession
} = require('./portwatch-session');

beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync.mockReturnValue(true);
});

test('createSession returns a valid session object', () => {
  fs.writeFileSync.mockImplementation(() => {});
  const session = createSession('my-session');
  expect(session.label).toBe('my-session');
  expect(session.active).toBe(true);
  expect(session.snapshots).toEqual([]);
  expect(session.startedAt).toBeDefined();
});

test('createSession uses id as label when none given', () => {
  fs.writeFileSync.mockImplementation(() => {});
  const session = createSession();
  expect(session.label).toMatch(/^session_/);
});

test('loadSession returns null if file missing', () => {
  fs.existsSync.mockReturnValue(false);
  const result = loadSession('nonexistent');
  expect(result).toBeNull();
});

test('loadSession parses and returns session', () => {
  const mock = { id: 'session_1', label: 'test', snapshots: [], active: true };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(mock));
  const result = loadSession('session_1');
  expect(result).toEqual(mock);
});

test('endSession sets endedAt and active false', () => {
  const mock = { id: 'session_1', label: 'test', snapshots: [], active: true, startedAt: new Date().toISOString() };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(mock));
  fs.writeFileSync.mockImplementation(() => {});
  const result = endSession('session_1');
  expect(result.active).toBe(false);
  expect(result.endedAt).toBeDefined();
});

test('appendSnapshot adds snapshot to session', () => {
  const mock = { id: 'session_1', snapshots: [], active: true };
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify(mock));
  fs.writeFileSync.mockImplementation(() => {});
  const result = appendSnapshot('session_1', [{ port: 3000 }]);
  expect(result.snapshots).toHaveLength(1);
  expect(result.snapshots[0].data).toEqual([{ port: 3000 }]);
});

test('listSessions returns all sessions', () => {
  const mock = { id: 'session_1', label: 'test' };
  fs.readdirSync.mockReturnValue(['session_1.json']);
  fs.readFileSync.mockReturnValue(JSON.stringify(mock));
  const result = listSessions();
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('session_1');
});

test('clearSession removes file if it exists', () => {
  fs.existsSync.mockReturnValue(true);
  fs.unlinkSync.mockImplementation(() => {});
  clearSession('session_1');
  expect(fs.unlinkSync).toHaveBeenCalled();
});
