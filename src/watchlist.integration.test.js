const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('./config', () => ({
  ensureConfigDir: () => require('os').tmpdir()
}));

const {
  addToWatchlist,
  removeFromWatchlist,
  loadWatchlist,
  isWatched,
  clearWatchlist,
  getWatchlistPath
} = require('./watchlist');

beforeEach(() => clearWatchlist());
afterAll(() => {
  const p = getWatchlistPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

test('full add/check/remove lifecycle', () => {
  addToWatchlist(8080, 'nginx');
  addToWatchlist(3000, 'react');
  addToWatchlist(5432, 'postgres');

  expect(loadWatchlist()).toHaveLength(3);
  expect(isWatched(3000)).toBe(true);
  expect(isWatched(9999)).toBe(false);

  removeFromWatchlist(3000);
  expect(loadWatchlist()).toHaveLength(2);
  expect(isWatched(3000)).toBe(false);
});

test('persists entries across reloads', () => {
  addToWatchlist(7000, 'api');
  // re-require to simulate fresh load
  jest.resetModules();
  jest.mock('./config', () => ({
    ensureConfigDir: () => require('os').tmpdir()
  }));
  const { loadWatchlist: freshLoad } = require('./watchlist');
  const list = freshLoad();
  expect(list.some(e => e.port === 7000)).toBe(true);
});

test('addedAt is a valid ISO timestamp', () => {
  addToWatchlist(4200);
  const [entry] = loadWatchlist();
  expect(() => new Date(entry.addedAt)).not.toThrow();
  expect(new Date(entry.addedAt).toISOString()).toBe(entry.addedAt);
});
