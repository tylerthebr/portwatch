#!/usr/bin/env node
'use strict';

const {
  createSession,
  loadSession,
  endSession,
  listSessions,
  clearSession
} = require('../src/portwatch-session');

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log('Usage: portwatch-session <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  start [label]     Start a new session');
  console.log('  end <id>          End a session by ID');
  console.log('  list              List all sessions');
  console.log('  show <id>         Show session details');
  console.log('  clear <id>        Delete a session');
}

if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

if (cmd === 'start') {
  const label = args[1] || '';
  const session = createSession(label);
  console.log(`Session started: ${session.id}`);
  if (label) console.log(`Label: ${label}`);
  console.log(`Started at: ${session.startedAt}`);
  process.exit(0);
}

if (cmd === 'end') {
  const id = args[1];
  if (!id) { console.error('Error: session ID required'); process.exit(1); }
  const session = endSession(id);
  if (!session) { console.error(`Session not found: ${id}`); process.exit(1); }
  console.log(`Session ended: ${session.id}`);
  console.log(`Ended at: ${session.endedAt}`);
  process.exit(0);
}

if (cmd === 'list') {
  const sessions = listSessions();
  if (!sessions.length) { console.log('No sessions found.'); process.exit(0); }
  sessions.forEach(s => {
    const status = s.active ? 'active' : 'ended';
    console.log(`[${status}] ${s.id}  label=${s.label}  snapshots=${s.snapshots.length}  started=${s.startedAt}`);
  });
  process.exit(0);
}

if (cmd === 'show') {
  const id = args[1];
  if (!id) { console.error('Error: session ID required'); process.exit(1); }
  const session = loadSession(id);
  if (!session) { console.error(`Session not found: ${id}`); process.exit(1); }
  console.log(JSON.stringify(session, null, 2));
  process.exit(0);
}

if (cmd === 'clear') {
  const id = args[1];
  if (!id) { console.error('Error: session ID required'); process.exit(1); }
  clearSession(id);
  console.log(`Session cleared: ${id}`);
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
usage();
process.exit(1);
