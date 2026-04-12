#!/usr/bin/env node
// bin/portwatch-rules.js — CLI for managing port alert rules

const { addRule, removeRule, loadRules, evaluateAll } = require('../src/portwatch-rules');
const { loadSnapshot } = require('../src/snapshot');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log(`
Usage: portwatch-rules <command> [options]

Commands:
  list                    List all rules
  add <id> <type> [opts]  Add a rule (types: port_open, port_range, process_match, protocol_match)
  remove <id>             Remove a rule by id
  eval                    Evaluate all rules against the latest snapshot

Examples:
  portwatch-rules add watch-3000 port_open --port 3000
  portwatch-rules add dev-range port_range --min 3000 --max 3999
  portwatch-rules remove watch-3000
  portwatch-rules eval
`.trim());
}

function parseOpts(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1];
      opts[key] = isNaN(val) ? val : Number(val);
      i++;
    }
  }
  return opts;
}

switch (cmd) {
  case 'list': {
    const rules = loadRules();
    if (rules.length === 0) { console.log('No rules defined.'); break; }
    rules.forEach(r => console.log(`[${r.id}] type=${r.type} created=${r.createdAt}`, JSON.stringify(r)));
    break;
  }
  case 'add': {
    const [id, type, ...rest] = args;
    if (!id || !type) { usage(); process.exit(1); }
    const opts = parseOpts(rest);
    try {
      addRule({ id, type, ...opts });
      console.log(`Rule '${id}' added.`);
    } catch (e) {
      console.error(e.message); process.exit(1);
    }
    break;
  }
  case 'remove': {
    const [id] = args;
    if (!id) { usage(); process.exit(1); }
    try {
      removeRule(id);
      console.log(`Rule '${id}' removed.`);
    } catch (e) {
      console.error(e.message); process.exit(1);
    }
    break;
  }
  case 'eval': {
    const rules = loadRules();
    const snapshot = loadSnapshot();
    const entries = snapshot ? Object.values(snapshot) : [];
    const triggered = evaluateAll(rules, entries);
    if (triggered.length === 0) { console.log('No rules triggered.'); break; }
    triggered.forEach(({ rule, matches }) => {
      console.log(`TRIGGERED: [${rule.id}] (${rule.type}) — ${matches.length} match(es)`);
      matches.forEach(m => console.log(`  port=${m.port} process=${m.process || '?'}`))
    });
    break;
  }
  default:
    usage();
}
