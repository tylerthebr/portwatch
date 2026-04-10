// portaudit.js — audit ports against expected/allowed definitions

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');

const DEFAULT_AUDIT_FILE = 'portaudit.json';

function getAuditPath() {
  const config = loadConfig();
  const dir = config.configDir || path.join(process.env.HOME || '.', '.portwatch');
  return path.join(dir, DEFAULT_AUDIT_FILE);
}

function loadAuditRules() {
  const auditPath = getAuditPath();
  if (!fs.existsSync(auditPath)) return [];
  try {
    const raw = fs.readFileSync(auditPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAuditRules(rules) {
  const auditPath = getAuditPath();
  fs.writeFileSync(auditPath, JSON.stringify(rules, null, 2), 'utf8');
}

function addAuditRule(rule) {
  const rules = loadAuditRules();
  const exists = rules.some(r => r.port === rule.port && r.protocol === rule.protocol);
  if (!exists) {
    rules.push({ ...rule, addedAt: new Date().toISOString() });
    saveAuditRules(rules);
  }
  return rules;
}

function removeAuditRule(port, protocol = 'tcp') {
  const rules = loadAuditRules();
  const updated = rules.filter(r => !(r.port === port && r.protocol === protocol));
  saveAuditRules(updated);
  return updated;
}

function auditPorts(entries) {
  const rules = loadAuditRules();
  if (rules.length === 0) return { violations: [], ok: entries };

  const violations = [];
  const ok = [];

  for (const entry of entries) {
    const rule = rules.find(r => r.port === entry.port && r.protocol === (entry.protocol || 'tcp'));
    if (!rule) {
      violations.push({ ...entry, reason: 'unlisted port' });
    } else if (rule.process && entry.process && !entry.process.includes(rule.process)) {
      violations.push({ ...entry, reason: `unexpected process (expected: ${rule.process})` });
    } else {
      ok.push(entry);
    }
  }

  return { violations, ok };
}

module.exports = {
  getAuditPath,
  loadAuditRules,
  saveAuditRules,
  addAuditRule,
  removeAuditRule,
  auditPorts
};
