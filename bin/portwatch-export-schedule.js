#!/usr/bin/env node
// bin/portwatch-export-schedule.js
// CLI for managing scheduled exports

const {
  loadExportSchedules,
  addExportSchedule,
  removeExportSchedule,
  getDueSchedules
} = require('../src/portwatch-export-schedule');

function usage() {
  console.log(`
Usage: portwatch-export-schedule <command> [options]

Commands:
  list                          List all export schedules
  add <name> <format> <dir> <intervalMinutes>   Add a new export schedule
  remove <name>                 Remove an export schedule
  due                           Show schedules due to run

Examples:
  portwatch-export-schedule add daily json /tmp/exports 1440
  portwatch-export-schedule remove daily
  portwatch-export-schedule due
  `);
}

const [,, cmd, ...args] = process.argv;

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (cmd === 'list') {
  const schedules = loadExportSchedules();
  if (!schedules.length) {
    console.log('No export schedules configured.');
  } else {
    schedules.forEach(s => {
      const last = s.lastRunAt ? s.lastRunAt : 'never';
      console.log(`  [${s.name}] format=${s.format} dir=${s.outputDir} every=${s.intervalMinutes}min last=${last}`);
    });
  }
  process.exit(0);
}

if (cmd === 'add') {
  const [name, format, outputDir, intervalStr] = args;
  if (!name || !format || !outputDir || !intervalStr) {
    console.error('Usage: portwatch-export-schedule add <name> <format> <dir> <intervalMinutes>');
    process.exit(1);
  }
  try {
    const entry = addExportSchedule({ name, format, outputDir, intervalMinutes: Number(intervalStr) });
    console.log(`Added export schedule '${entry.name}' (${entry.format} every ${entry.intervalMinutes} min -> ${entry.outputDir})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (cmd === 'remove') {
  const [name] = args;
  if (!name) { console.error('Usage: portwatch-export-schedule remove <name>'); process.exit(1); }
  const ok = removeExportSchedule(name);
  console.log(ok ? `Removed '${name}'.` : `No schedule named '${name}'.`);
  process.exit(0);
}

if (cmd === 'due') {
  const due = getDueSchedules();
  if (!due.length) {
    console.log('No schedules currently due.');
  } else {
    console.log('Due schedules:');
    due.forEach(s => console.log(`  [${s.name}] ${s.format} -> ${s.outputDir}`));
  }
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
usage();
process.exit(1);
