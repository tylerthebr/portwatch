#!/usr/bin/env node
// bin/portaliases.js — CLI for managing port aliases

const {
  setAlias,
  getAlias,
  removeAlias,
  clearAliases,
  loadAliases
} = require('../src/portaliases');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log('Usage:');
  console.log('  portaliases set <port> <alias>   — assign alias to port');
  console.log('  portaliases get <port>           — show alias for port');
  console.log('  portaliases remove <port>        — remove alias');
  console.log('  portaliases list                 — list all aliases');
  console.log('  portaliases clear                — remove all aliases');
}

switch (cmd) {
  case 'set': {
    const [port, alias] = args;
    if (!port || !alias) { console.error('Usage: portaliases set <port> <alias>'); process.exit(1); }
    setAlias(port, alias);
    console.log(`Alias set: port ${port} → "${alias}"`);
    break;
  }
  case 'get': {
    const [port] = args;
    if (!port) { console.error('Usage: portaliases get <port>'); process.exit(1); }
    const alias = getAlias(port);
    if (alias) {
      console.log(`${port} → ${alias}`);
    } else {
      console.log(`No alias found for port ${port}`);
    }
    break;
  }
  case 'remove': {
    const [port] = args;
    if (!port) { console.error('Usage: portaliases remove <port>'); process.exit(1); }
    removeAlias(port);
    console.log(`Alias removed for port ${port}`);
    break;
  }
  case 'list': {
    const aliases = loadAliases();
    const entries = Object.entries(aliases);
    if (entries.length === 0) {
      console.log('No aliases defined.');
    } else {
      entries.forEach(([port, alias]) => console.log(`  ${port.padStart(6)} → ${alias}`));
    }
    break;
  }
  case 'clear': {
    clearAliases();
    console.log('All aliases cleared.');
    break;
  }
  default:
    usage();
}
