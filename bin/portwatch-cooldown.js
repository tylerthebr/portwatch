#!/usr/bin/env node
// bin/portwatch-cooldown.js — CLI for managing port alert cooldowns

const {
  getActiveCooldowns,
  setCooldown,
  clearCooldown,
  clearAllCooldowns,
  pruneExpired
} = require('../src/portwatch-cooldown');

function usage() {
  console.log(`
Usage: portwatch-cooldown <command> [options]

Commands:
  list                     Show all active cooldowns
  set <port> [durationMs]  Set a cooldown for a port (default: 60000ms)
  clear <port>             Remove cooldown for a port
  clear-all                Remove all cooldowns
  prune                    Remove expired cooldown entries
`.trim());
}

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'list': {
    const active = getActiveCooldowns();
    if (active.length === 0) {
      console.log('No active cooldowns.');
    } else {
      console.log('Active cooldowns:');
      for (const c of active) {
        const remaining = (c.remainingMs / 1000).toFixed(1);
        const expires = new Date(c.expiresAt).toISOString();
        console.log(`  port ${c.port} — ${remaining}s remaining (expires ${expires})`);
      }
    }
    break;
  }
  case 'set': {
    const port = Number(args[0]);
    const duration = args[1] ? Number(args[1]) : 60000;
    if (!port) { console.error('Port required.'); process.exit(1); }
    setCooldown(port, duration);
    console.log(`Cooldown set for port ${port} (${duration}ms).`);
    break;
  }
  case 'clear': {
    const port = Number(args[0]);
    if (!port) { console.error('Port required.'); process.exit(1); }
    clearCooldown(port);
    console.log(`Cooldown cleared for port ${port}.`);
    break;
  }
  case 'clear-all': {
    clearAllCooldowns();
    console.log('All cooldowns cleared.');
    break;
  }
  case 'prune': {
    pruneExpired();
    console.log('Expired cooldowns pruned.');
    break;
  }
  default:
    usage();
    if (cmd) process.exit(1);
}
