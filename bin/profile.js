#!/usr/bin/env node
'use strict';

const { getProfile, setProfile, removeProfile, listProfiles } = require('../src/profile');

const [,, cmd, name, ...rest] = process.argv;

function usage() {
  console.log('Usage: portwatch-profile <command> [name] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  list                  List all saved profiles');
  console.log('  get <name>            Show a profile');
  console.log('  set <name> [json]     Save a profile (reads JSON from arg or stdin)');
  console.log('  remove <name>         Delete a profile');
  process.exit(0);
}

async function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => (data += chunk));
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

async function main() {
  if (!cmd || cmd === '--help' || cmd === '-h') return usage();

  if (cmd === 'list') {
    const profiles = listProfiles();
    if (!profiles.length) return console.log('No profiles saved.');
    profiles.forEach(p => {
      const { name, updatedAt, ...config } = p;
      console.log(`[${name}] (updated: ${updatedAt})`);
      console.log(' ', JSON.stringify(config));
    });
    return;
  }

  if (cmd === 'get') {
    if (!name) { console.error('Error: profile name required'); process.exit(1); }
    const p = getProfile(name);
    if (!p) { console.error(`Profile '${name}' not found`); process.exit(1); }
    console.log(JSON.stringify(p, null, 2));
    return;
  }

  if (cmd === 'set') {
    if (!name) { console.error('Error: profile name required'); process.exit(1); }
    const raw = rest.length ? rest.join(' ') : await readStdin();
    let config = {};
    if (raw) {
      try { config = JSON.parse(raw); } catch { console.error('Error: invalid JSON'); process.exit(1); }
    }
    const saved = setProfile(name, config);
    console.log(`Profile '${name}' saved.`, JSON.stringify(saved));
    return;
  }

  if (cmd === 'remove') {
    if (!name) { console.error('Error: profile name required'); process.exit(1); }
    const ok = removeProfile(name);
    console.log(ok ? `Profile '${name}' removed.` : `Profile '${name}' not found.`);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch(err => { console.error(err.message); process.exit(1); });
