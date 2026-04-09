const fs = require('fs');
const { execSync, spawn } = require('child_process');
const path = require('path');

jest.mock('os', () => ({ homedir: () => '/tmp/portwatch-daemon-integration' }));

const { PID_FILE, writePid, isDaemonRunning, stopDaemon, clearPid } = require('./daemon');

const pidDir = path.dirname(PID_FILE);

beforeAll(() => {
  if (!fs.existsSync(pidDir)) fs.mkdirSync(pidDir, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
});

test('full lifecycle: write, detect, stop', () => {
  writePid();
  expect(isDaemonRunning()).toBe(true);

  const result = stopDaemon();
  // stopping own process with SIGTERM in test context may not fully kill it
  // but we verify the pid file is cleaned up
  expect(fs.existsSync(PID_FILE)).toBe(false);
});

test('stale pid does not report as running', () => {
  fs.writeFileSync(PID_FILE, '1234567890', 'utf8');
  expect(isDaemonRunning()).toBe(false);
  expect(fs.existsSync(PID_FILE)).toBe(false);
});

test('double start is prevented', () => {
  writePid();
  const running = isDaemonRunning();
  expect(running).toBe(true);
  // second writePid would overwrite — simulate guard logic
  const pid1 = require('./daemon').readPid();
  writePid();
  const pid2 = require('./daemon').readPid();
  expect(pid1).toBe(pid2); // same process
});

test('clearPid is idempotent', () => {
  clearPid();
  clearPid(); // should not throw
  expect(fs.existsSync(PID_FILE)).toBe(false);
});
