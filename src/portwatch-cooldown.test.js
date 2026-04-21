const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => tmpDir
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-cooldown-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function load() {
  return require('./portwatch-cooldown');
}

test('isOnCooldown returns false when no cooldown set', () => {
  const { isOnCooldown } = load();
  expect(isOnCooldown(3000)).toBe(false);
});

test('setCooldown marks port as on cooldown', () => {
  const { setCooldown, isOnCooldown } = load();
  setCooldown(3000, 60000);
  expect(isOnCooldown(3000)).toBe(true);
});

test('isOnCooldown returns false after expiry', () => {
  const { setCooldown, isOnCooldown } = load();
  setCooldown(3000, -1000); // already expired
  expect(isOnCooldown(3000)).toBe(false);
});

test('clearCooldown removes a specific port', () => {
  const { setCooldown, clearCooldown, isOnCooldown } = load();
  setCooldown(3000, 60000);
  clearCooldown(3000);
  expect(isOnCooldown(3000)).toBe(false);
});

test('clearAllCooldowns removes everything', () => {
  const { setCooldown, clearAllCooldowns, getActiveCooldowns } = load();
  setCooldown(3000, 60000);
  setCooldown(8080, 60000);
  clearAllCooldowns();
  expect(getActiveCooldowns()).toHaveLength(0);
});

test('getActiveCooldowns returns only non-expired entries', () => {
  const { setCooldown, getActiveCooldowns } = load();
  setCooldown(3000, 60000);
  setCooldown(8080, -1000);
  const active = getActiveCooldowns();
  expect(active).toHaveLength(1);
  expect(active[0].port).toBe(3000);
  expect(active[0].remainingMs).toBeGreaterThan(0);
});

test('pruneExpired removes stale entries from file', () => {
  const { setCooldown, pruneExpired, loadCooldowns } = load();
  setCooldown(3000, 60000);
  setCooldown(9000, -500);
  pruneExpired();
  const cooldowns = loadCooldowns();
  expect(cooldowns['3000']).toBeDefined();
  expect(cooldowns['9000']).toBeUndefined();
});

test('loadCooldowns returns empty object when file missing', () => {
  const { loadCooldowns } = load();
  expect(loadCooldowns()).toEqual({});
});
