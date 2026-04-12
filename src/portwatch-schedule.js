// portwatch-schedule.js — manage named scan schedules (cron-like intervals)

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

const SCHEDULE_FILE = 'schedules.json';

function getSchedulePath() {
  return path.join(ensureConfigDir(), SCHEDULE_FILE);
}

function loadSchedules() {
  const p = getSchedulePath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveSchedules(schedules) {
  fs.writeFileSync(getSchedulePath(), JSON.stringify(schedules, null, 2));
}

function addSchedule(name, intervalSeconds, opts = {}) {
  if (!name || typeof intervalSeconds !== 'number' || intervalSeconds < 5) {
    throw new Error('Invalid schedule: name required and interval must be >= 5s');
  }
  const schedules = loadSchedules();
  schedules[name] = {
    name,
    intervalSeconds,
    enabled: opts.enabled !== false,
    notify: opts.notify !== false,
    createdAt: new Date().toISOString(),
    lastRun: null,
  };
  saveSchedules(schedules);
  return schedules[name];
}

function removeSchedule(name) {
  const schedules = loadSchedules();
  if (!schedules[name]) return false;
  delete schedules[name];
  saveSchedules(schedules);
  return true;
}

function getSchedule(name) {
  return loadSchedules()[name] || null;
}

function updateLastRun(name, timestamp = new Date().toISOString()) {
  const schedules = loadSchedules();
  if (!schedules[name]) return false;
  schedules[name].lastRun = timestamp;
  saveSchedules(schedules);
  return true;
}

function listSchedules() {
  return Object.values(loadSchedules());
}

function clearSchedules() {
  saveSchedules({});
}

module.exports = {
  getSchedulePath,
  loadSchedules,
  saveSchedules,
  addSchedule,
  removeSchedule,
  getSchedule,
  updateLastRun,
  listSchedules,
  clearSchedules,
};
