// portwatch-rules.js — define and evaluate alert rules against port snapshots

const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getRulesPath() {
  return path.join(ensureConfigDir(), 'rules.json');
}

function loadRules() {
  const p = getRulesPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function saveRules(rules) {
  fs.writeFileSync(getRulesPath(), JSON.stringify(rules, null, 2));
}

function addRule(rule) {
  if (!rule.id || !rule.type) throw new Error('Rule must have id and type');
  const rules = loadRules();
  if (rules.find(r => r.id === rule.id)) throw new Error(`Rule '${rule.id}' already exists`);
  rules.push({ ...rule, createdAt: new Date().toISOString() });
  saveRules(rules);
  return rule;
}

function removeRule(id) {
  const rules = loadRules();
  const next = rules.filter(r => r.id !== id);
  if (next.length === rules.length) throw new Error(`Rule '${id}' not found`);
  saveRules(next);
}

/**
 * Evaluates a single rule against a single port entry.
 * Supported rule types:
 *   - port_open:      matches a specific port number
 *   - port_range:     matches ports between min and max (inclusive)
 *   - process_match:  matches entries whose process name contains rule.process
 *   - protocol_match: matches entries with an exact protocol string (e.g. 'tcp')
 */
function evaluateRule(rule, entry) {
  switch (rule.type) {
    case 'port_open':
      return entry.port === rule.port;
    case 'port_range':
      return entry.port >= rule.min && entry.port <= rule.max;
    case 'process_match':
      return entry.process && entry.process.includes(rule.process);
    case 'protocol_match':
      return entry.protocol === rule.protocol;
    default:
      return false;
  }
}

function evaluateAll(rules, entries) {
  const triggered = [];
  for (const rule of rules) {
    const matches = entries.filter(e => evaluateRule(rule, e));
    if (matches.length > 0) {
      triggered.push({ rule, matches });
    }
  }
  return triggered;
}

/**
 * Returns the rule with the given id, or null if not found.
 */
function getRule(id) {
  const rules = loadRules();
  return rules.find(r => r.id === id) || null;
}

module.exports = {
  getRulesPath,
  loadRules,
  saveRules,
  addRule,
  removeRule,
  getRule,
  evaluateRule,
  evaluateAll
};
