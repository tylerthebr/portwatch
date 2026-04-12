const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSION_DIR = path.join(os.homedir(), '.portwatch', 'sessions');

function getSessionPath(sessionId) {
  return path.join(SESSION_DIR, `${sessionId}.json`);
}

function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

function createSession(label = '') {
  ensureSessionDir();
  const sessionId = `session_${Date.now()}`;
  const session = {
    id: sessionId,
    label: label || sessionId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    snapshots: [],
    active: true
  };
  fs.writeFileSync(getSessionPath(sessionId), JSON.stringify(session, null, 2));
  return session;
}

function loadSession(sessionId) {
  const p = getSessionPath(sessionId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveSession(session) {
  ensureSessionDir();
  fs.writeFileSync(getSessionPath(session.id), JSON.stringify(session, null, 2));
}

function endSession(sessionId) {
  const session = loadSession(sessionId);
  if (!session) return null;
  session.endedAt = new Date().toISOString();
  session.active = false;
  saveSession(session);
  return session;
}

function appendSnapshot(sessionId, snapshot) {
  const session = loadSession(sessionId);
  if (!session) return null;
  session.snapshots.push({ timestamp: new Date().toISOString(), data: snapshot });
  saveSession(session);
  return session;
}

function listSessions() {
  ensureSessionDir();
  return fs.readdirSync(SESSION_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(SESSION_DIR, f), 'utf8')));
}

function clearSession(sessionId) {
  const p = getSessionPath(sessionId);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

module.exports = {
  getSessionPath,
  createSession,
  loadSession,
  saveSession,
  endSession,
  appendSnapshot,
  listSessions,
  clearSession
};
