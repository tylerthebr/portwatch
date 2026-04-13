#!/usr/bin/env node
// CLI for managing port suppression rules

const {
  loadSuppressions,
  addSuppression,
  removeSuppression,
  clearSuppressions,
} = require('../src/portwatch-suppress');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log(`
Usage: portwatch-suppress <command> [options]

Commands:
  list                     List all suppression rules
  add <port> [reason]      Suppress alerts for a port or range (e.g. 3000 or 3000-3010)
  remove <port>            Remove suppression for a port
  clear                    Remove all suppression rules
`.trim());
}

function run() {
  if (!cmd || cmd === 'help' || cmd === '--help') {
    usage();
    return;
  }

  if (cmd === 'list') {
    const list = loadSuppressions();
    if (list.length === 0) {
      console.log('No suppression rules defined.');
      return;
    }
    console.log(`${'PORT'.padEnd(18)} ${'REASON'.padEnd(30)} CREATED`);
    for (const r of list) {
      const port = String(r.port).padEnd(18);
      const reason = (r.reason || '—').padEnd(30);
      const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '—';
      console.log(`${port} ${reason} ${created}`);
    }
    return;
  }

  if (cmd === 'add') {
    const port = args[0];
    if (!port) { console.error('Error: port required'); process.exit(1); }
    const reason = args.slice(1).join(' ') || undefined;
    const portVal = port.includes('-') ? port : Number(port);
    const added = addSuppression({ port: portVal, reason });
    if (added) {
      console.log(`Suppressed port ${port}${reason ? ` (${reason})` : ''}.`);
    } else {
      console.log(`Port ${port} is already suppressed.`);
    }
    return;
  }

  if (cmd === 'remove') {
    const port = args[0];
    if (!port) { console.error('Error: port required'); process.exit(1); }
    const portVal = port.includes('-') ? port : Number(port);
    const removed = removeSuppression(portVal);
    console.log(removed ? `Removed suppression for port ${port}.` : `No rule found for port ${port}.`);
    return;
  }

  if (cmd === 'clear') {
    clearSuppressions();
    console.log('All suppression rules cleared.');
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

run();
