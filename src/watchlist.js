const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const WATCHLIST_FILE = 'watchlist.json';

function getWatchlistPath() {
  return path.join(ensureConfigDir(), WATCHLIST_FILE);
}

function loadWatchlist() {
  const p = getWatchlistPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function saveWatchlist(list) {
  fs.writeFileSync(getWatchlistPath(), JSON.stringify(list, null, 2));
}

function addToWatchlist(port, label = '') {
  const list = loadWatchlist();
  const entry = { port: Number(port), label, addedAt: new Date().toISOString() };
  if (list.find(e => e.port === entry.port)) return false;
  list.push(entry);
  saveWatchlist(list);
  return true;
}

function removeFromWatchlist(port) {
  const list = loadWatchlist();
  const filtered = list.filter(e => e.port !== Number(port));
  if (filtered.length === list.length) return false;
  saveWatchlist(filtered);
  return true;
}

function isWatched(port) {
  return loadWatchlist().some(e => e.port === Number(port));
}

function clearWatchlist() {
  saveWatchlist([]);
}

module.exports = {
  getWatchlistPath,
  loadWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isWatched,
  clearWatchlist
};
