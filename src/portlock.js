// portlock.js — track ports that should be "locked" (reserved/expected) and flag unexpected changes

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCK_FILE = path.join(os.homedir(), '.portwatch', 'portlock.json');

function getLockPath() {
  return LOCK_FILE;
}

function loadLocks() {
  if (!fs.existsSync(LOCK_FILE)) return {};
  try {
    const raw = fs.readFileSync(LOCK_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocks(locks) {
  const dir = path.dirname(LOCK_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCK_FILE, JSON.stringify(locks, null, 2), 'utf8');
}

function lockPort(port, meta = {}) {
  const locks = loadLocks();
  locks[String(port)] = {
    port: Number(port),
    lockedAt: new Date().toISOString(),
    note: meta.note || '',
    process: meta.process || null,
  };
  saveLocks(locks);
  return locks[String(port)];
}

function unlockPort(port) {
  const locks = loadLocks();
  const existed = Boolean(locks[String(port)]);
  delete locks[String(port)];
  saveLocks(locks);
  return existed;
}

function isLocked(port) {
  const locks = loadLocks();
  return Boolean(locks[String(port)]);
}

function getLock(port) {
  const locks = loadLocks();
  return locks[String(port)] || null;
}

function clearLocks() {
  saveLocks({});
}

function auditAgainstLocks(currentPorts) {
  const locks = loadLocks();
  const violations = [];

  for (const [portStr, lockEntry] of Object.entries(locks)) {
    const port = Number(portStr);
    const active = currentPorts.find(p => Number(p.port) === port);
    if (!active) {
      violations.push({ type: 'missing', port, lock: lockEntry });
    } else if (lockEntry.process && active.process !== lockEntry.process) {
      violations.push({ type: 'process_mismatch', port, lock: lockEntry, actual: active.process });
    }
  }

  return violations;
}

module.exports = {
  getLockPath,
  loadLocks,
  saveLocks,
  lockPort,
  unlockPort,
  isLocked,
  getLock,
  clearLocks,
  auditAgainstLocks,
};
