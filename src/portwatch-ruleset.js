const fs = require('fs');
const path = require('path');
const { ensureConfigDir } = require('./config');

function getRulesetPath() {
  return path.join(ensureConfigDir(), 'rulesets.json');
}

function loadRulesets() {
  const p = getRulesetPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function saveRulesets(rulesets) {
  fs.writeFileSync(getRulesetPath(), JSON.stringify(rulesets, null, 2));
}

function addRuleset(name, rules = []) {
  if (!name || typeof name !== 'string') throw new Error('Ruleset name required');
  const rulesets = loadRulesets();
  rulesets[name] = { name, rules, createdAt: new Date().toISOString() };
  saveRulesets(rulesets);
  return rulesets[name];
}

function removeRuleset(name) {
  const rulesets = loadRulesets();
  if (!rulesets[name]) return false;
  delete rulesets[name];
  saveRulesets(rulesets);
  return true;
}

function getRuleset(name) {
  return loadRulesets()[name] || null;
}

function applyRuleset(name, entries) {
  const ruleset = getRuleset(name);
  if (!ruleset) return entries;
  return entries.filter(entry => {
    return ruleset.rules.every(rule => {
      if (rule.port && entry.port !== rule.port) return false;
      if (rule.protocol && entry.protocol !== rule.protocol) return false;
      if (rule.process && !entry.process?.includes(rule.process)) return false;
      return true;
    });
  });
}

function listRulesets() {
  return Object.values(loadRulesets());
}

module.exports = {
  getRulesetPath,
  loadRulesets,
  saveRulesets,
  addRuleset,
  removeRuleset,
  getRuleset,
  applyRuleset,
  listRulesets
};
