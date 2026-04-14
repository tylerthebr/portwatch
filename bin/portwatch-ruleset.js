#!/usr/bin/env node
'use strict';

const {
  addRuleset,
  removeRuleset,
  getRuleset,
  listRulesets,
  applyRuleset
} = require('../src/portwatch-ruleset');

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log([
    'Usage: portwatch-ruleset <command> [options]',
    '',
    'Commands:',
    '  add <name> [rule...]   Add a named ruleset (rules as port:3000 proto:tcp proc:node)',
    '  remove <name>          Remove a ruleset by name',
    '  get <name>             Show a ruleset',
    '  list                   List all rulesets',
  ].join('\n'));
}

function parseRules(args) {
  return args.map(arg => {
    const [key, val] = arg.split(':');
    if (!key || !val) return null;
    const rule = {};
    if (key === 'port') rule.port = parseInt(val, 10);
    else if (key === 'proto') rule.protocol = val;
    else if (key === 'proc') rule.process = val;
    return rule;
  }).filter(Boolean);
}

if (cmd === 'add') {
  const [name, ...ruleArgs] = args;
  if (!name) { usage(); process.exit(1); }
  const rules = parseRules(ruleArgs);
  const rs = addRuleset(name, rules);
  console.log(`Added ruleset "${rs.name}" with ${rs.rules.length} rule(s).`);

} else if (cmd === 'remove') {
  const [name] = args;
  if (!name) { usage(); process.exit(1); }
  const ok = removeRuleset(name);
  console.log(ok ? `Removed ruleset "${name}".` : `Ruleset "${name}" not found.`);

} else if (cmd === 'get') {
  const [name] = args;
  if (!name) { usage(); process.exit(1); }
  const rs = getRuleset(name);
  if (!rs) { console.log(`Ruleset "${name}" not found.`); process.exit(1); }
  console.log(JSON.stringify(rs, null, 2));

} else if (cmd === 'list') {
  const list = listRulesets();
  if (!list.length) { console.log('No rulesets defined.'); }
  else list.forEach(rs => console.log(`${rs.name} (${rs.rules.length} rules) — created ${rs.createdAt}`));

} else {
  usage();
  process.exit(cmd ? 1 : 0);
}
