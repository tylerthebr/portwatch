// portwatch-export-schedule.js
// Manages scheduled exports: run exports on a recurring basis and save output

const fs = require('fs');
const path = require('path');
const os = require('os');

const EXPORT_SCHEDULE_FILE = path.join(os.homedir(), '.portwatch', 'export-schedules.json');

function getExportSchedulePath() {
  return EXPORT_SCHEDULE_FILE;
}

function loadExportSchedules() {
  if (!fs.existsSync(EXPORT_SCHEDULE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(EXPORT_SCHEDULE_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveExportSchedules(schedules) {
  const dir = path.dirname(EXPORT_SCHEDULE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(EXPORT_SCHEDULE_FILE, JSON.stringify(schedules, null, 2));
}

function addExportSchedule({ name, format, outputDir, intervalMinutes }) {
  if (!name || !format || !outputDir || !intervalMinutes) {
    throw new Error('name, format, outputDir, and intervalMinutes are required');
  }
  const schedules = loadExportSchedules();
  if (schedules.find(s => s.name === name)) {
    throw new Error(`Export schedule '${name}' already exists`);
  }
  const entry = {
    name,
    format,
    outputDir,
    intervalMinutes,
    createdAt: new Date().toISOString(),
    lastRunAt: null
  };
  schedules.push(entry);
  saveExportSchedules(schedules);
  return entry;
}

function removeExportSchedule(name) {
  const schedules = loadExportSchedules();
  const next = schedules.filter(s => s.name !== name);
  if (next.length === schedules.length) return false;
  saveExportSchedules(next);
  return true;
}

function getDueSchedules() {
  const schedules = loadExportSchedules();
  const now = Date.now();
  return schedules.filter(s => {
    if (!s.lastRunAt) return true;
    const elapsed = (now - new Date(s.lastRunAt).getTime()) / 1000 / 60;
    return elapsed >= s.intervalMinutes;
  });
}

function markScheduleRun(name) {
  const schedules = loadExportSchedules();
  const s = schedules.find(s => s.name === name);
  if (!s) return false;
  s.lastRunAt = new Date().toISOString();
  saveExportSchedules(schedules);
  return true;
}

module.exports = {
  getExportSchedulePath,
  loadExportSchedules,
  saveExportSchedules,
  addExportSchedule,
  removeExportSchedule,
  getDueSchedules,
  markScheduleRun
};
