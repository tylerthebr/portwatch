const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('os', () => ({ homedir: () => '/tmp/portwatch-test-home' }));

const { writePid, readPid, clearPid, isDaemonRunning, stopDaemon, getDaemonStatus, PID_FILE } = require('./daemon');

beforeEach(() => {
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  const dir = path.dirname(PID_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
});

test('writePid writes current process pid', () => {
  writePid();
  const pid = readPid();
  expect(pid).toBe(process.pid);
});

test('readPid returns null when no file', () => {
  expect(readPid()).toBeNull();
});

test('clearPid removes the pid file', () => {
  writePid();
  clearPid();
  expect(fs.existsSync(PID_FILE)).toBe(false);
});

test('isDaemonRunning returns true for current process', () => {
  writePid();
  expect(isDaemonRunning()).toBe(true);
});

test('isDaemonRunning returns false when no pid file', () => {
  expect(isDaemonRunning()).toBe(false);
});

test('isDaemonRunning clears stale pid file', () => {
  fs.writeFileSync(PID_FILE, '99999999', 'utf8');
  expect(isDaemonRunning()).toBe(false);
  expect(fs.existsSync(PID_FILE)).toBe(false);
});

test('getDaemonStatus reflects running state', () => {
  writePid();
  const status = getDaemonStatus();
  expect(status.running).toBe(true);
  expect(status.pid).toBe(process.pid);
});

test('stopDaemon returns no pid file message when not running', () => {
  const result = stopDaemon();
  expect(result.stopped).toBe(false);
  expect(result.reason).toMatch(/no pid file/);
});
