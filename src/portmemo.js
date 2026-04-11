// portmemo.js — persist arbitrary notes/annotations on specific ports

const fs = require('fs');
const path = require('path');
const os = require('os');

const MEMO_FILE = path.join(os.homedir(), '.portwatch', 'memos.json');

function getMemoPath() {
  return MEMO_FILE;
}

function loadMemos() {
  try {
    if (!fs.existsSync(MEMO_FILE)) return {};
    const raw = fs.readFileSync(MEMO_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveMemos(memos) {
  const dir = path.dirname(MEMO_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MEMO_FILE, JSON.stringify(memos, null, 2), 'utf8');
}

function setMemo(port, note) {
  if (!port || typeof note !== 'string') throw new Error('port and note are required');
  const memos = loadMemos();
  memos[String(port)] = { note: note.trim(), updatedAt: new Date().toISOString() };
  saveMemos(memos);
  return memos[String(port)];
}

function getMemo(port) {
  const memos = loadMemos();
  return memos[String(port)] || null;
}

function removeMemo(port) {
  const memos = loadMemos();
  const existed = String(port) in memos;
  delete memos[String(port)];
  if (existed) saveMemos(memos);
  return existed;
}

function clearMemos() {
  saveMemos({});
}

function listMemos() {
  const memos = loadMemos();
  return Object.entries(memos).map(([port, data]) => ({
    port: Number(port),
    note: data.note,
    updatedAt: data.updatedAt,
  }));
}

function annotateMemo(entry) {
  if (!entry || !entry.port) return entry;
  const memo = getMemo(entry.port);
  return memo ? { ...entry, memo: memo.note } : entry;
}

module.exports = {
  getMemoPath,
  loadMemos,
  saveMemos,
  setMemo,
  getMemo,
  removeMemo,
  clearMemos,
  listMemos,
  annotateMemo,
};
