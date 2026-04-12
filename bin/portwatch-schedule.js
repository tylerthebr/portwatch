#!/usr/bin/env node
// bin/portwatch-schedule.js — CLI for managing portwatch scan schedules

const {
  addSchedule,
  removeSchedule,
  listSchedules,
  getSchedule,
  clearSchedules,
} = require('../src/portwatch-schedule');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log([
    'Usage: portwatch-schedule <command> [options]',
    '',
    'Commands:',
    '  add <name> <seconds> [--no-notify] [--disabled]',
    '  remove <name>',
    '  list',
    '  show <name>',
    '  clear',
  ].join('\n'));
}

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (cmd === 'add') {
  const [name, rawSecs] = args;
  const intervalSeconds = parseInt(rawSecs, 10);
  const notify = !args.includes('--no-notify');
  const enabled = !args.includes('--disabled');
  try {
    const s = addSchedule(name, intervalSeconds, { notify, enabled });
    console.log(`Schedule '${s.name}' added (every ${s.intervalSeconds}s).`);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }

} else if (cmd === 'remove') {
  const [name] = args;
  const ok = removeSchedule(name);
  console.log(ok ? `Removed '${name}'.` : `No schedule named '${name}'.`);

} else if (cmd === 'list') {
  const list = listSchedules();
  if (!list.length) {
    console.log('No schedules defined.');
  } else {
    list.forEach(s => {
      const status = s.enabled ? 'enabled' : 'disabled';
      const notify = s.notify ? 'notify' : 'silent';
      console.log(`  ${s.name.padEnd(16)} ${String(s.intervalSeconds).padStart(6)}s  [${status}] [${notify}]  last: ${s.lastRun || 'never'}`);
    });
  }

} else if (cmd === 'show') {
  const s = getSchedule(args[0]);
  if (!s) {
    console.error(`No schedule named '${args[0]}'.`);
    process.exit(1);
  }
  console.log(JSON.stringify(s, null, 2));

} else if (cmd === 'clear') {
  clearSchedules();
  console.log('All schedules cleared.');

} else {
  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}
