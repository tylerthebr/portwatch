#!/usr/bin/env node
// bin/portaudit.js — CLI for managing and running port audits

const { loadAuditRules, addAuditRule, removeAuditRule, auditPorts } = require('../src/portaudit');
const { scanPorts } = require('./portwatch');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log(`
Usage: portaudit <command> [options]

Commands:
  list                      List all audit rules
  add <port> [proto] [proc] Add an allowed port rule
  remove <port> [proto]     Remove an audit rule
  run                       Scan and audit current ports

Examples:
  portaudit add 3000 tcp node
  portaudit remove 3000 tcp
  portaudit run
`.trim());
}

async function main() {
  switch (cmd) {
    case 'list': {
      const rules = loadAuditRules();
      if (rules.length === 0) {
        console.log('No audit rules defined.');
      } else {
        console.log(`${'PORT'.padEnd(8)}${'PROTO'.padEnd(8)}PROCESS`);
        console.log('-'.repeat(30));
        for (const r of rules) {
          console.log(`${String(r.port).padEnd(8)}${(r.protocol || 'tcp').padEnd(8)}${r.process || '*'}`);
        }
      }
      break;
    }
    case 'add': {
      const [port, protocol = 'tcp', process] = args;
      if (!port) { usage(); process.exit(1); }
      addAuditRule({ port: Number(port), protocol, process });
      console.log(`✔ Added audit rule for port ${port} (${protocol})`);
      break;
    }
    case 'remove': {
      const [port, protocol = 'tcp'] = args;
      if (!port) { usage(); process.exit(1); }
      removeAuditRule(Number(port), protocol);
      console.log(`✔ Removed audit rule for port ${port} (${protocol})`);
      break;
    }
    case 'run': {
      const entries = await scanPorts();
      const { violations, ok } = auditPorts(entries);
      console.log(`\nAudit complete: ${ok.length} ok, ${violations.length} violation(s)\n`);
      if (violations.length > 0) {
        console.log('VIOLATIONS:');
        for (const v of violations) {
          console.log(`  ⚠ Port ${v.port}/${v.protocol || 'tcp'} — ${v.reason} (process: ${v.process || 'unknown'})`);
        }
        process.exit(1);
      } else {
        console.log('All ports are within allowed rules.');
      }
      break;
    }
    default:
      usage();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
