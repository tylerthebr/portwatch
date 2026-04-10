const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  loadConfig: () => ({ configDir: require('os').tmpdir() })
}));

const {
  loadAuditRules,
  saveAuditRules,
  addAuditRule,
  removeAuditRule,
  auditPorts,
  getAuditPath
} = require('./portaudit');

beforeEach(() => {
  const p = getAuditPath();
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

test('loadAuditRules returns empty array when no file', () => {
  expect(loadAuditRules()).toEqual([]);
});

test('saveAuditRules and loadAuditRules round-trip', () => {
  const rules = [{ port: 3000, protocol: 'tcp', process: 'node' }];
  saveAuditRules(rules);
  expect(loadAuditRules()).toEqual(rules);
});

test('addAuditRule adds a new rule with timestamp', () => {
  const rules = addAuditRule({ port: 8080, protocol: 'tcp', process: 'nginx' });
  expect(rules).toHaveLength(1);
  expect(rules[0].port).toBe(8080);
  expect(rules[0].addedAt).toBeDefined();
});

test('addAuditRule does not add duplicates', () => {
  addAuditRule({ port: 8080, protocol: 'tcp' });
  const rules = addAuditRule({ port: 8080, protocol: 'tcp' });
  expect(rules).toHaveLength(1);
});

test('removeAuditRule removes matching rule', () => {
  addAuditRule({ port: 3000, protocol: 'tcp' });
  addAuditRule({ port: 4000, protocol: 'tcp' });
  const updated = removeAuditRule(3000, 'tcp');
  expect(updated).toHaveLength(1);
  expect(updated[0].port).toBe(4000);
});

test('auditPorts returns all as ok when no rules', () => {
  const entries = [{ port: 3000, protocol: 'tcp', process: 'node' }];
  const { violations, ok } = auditPorts(entries);
  expect(violations).toHaveLength(0);
  expect(ok).toHaveLength(1);
});

test('auditPorts flags unlisted ports as violations', () => {
  addAuditRule({ port: 3000, protocol: 'tcp' });
  const entries = [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 9999, protocol: 'tcp', process: 'unknown' }
  ];
  const { violations, ok } = auditPorts(entries);
  expect(violations).toHaveLength(1);
  expect(violations[0].port).toBe(9999);
  expect(violations[0].reason).toBe('unlisted port');
  expect(ok).toHaveLength(1);
});

test('auditPorts flags wrong process as violation', () => {
  addAuditRule({ port: 8080, protocol: 'tcp', process: 'nginx' });
  const entries = [{ port: 8080, protocol: 'tcp', process: 'apache2' }];
  const { violations } = auditPorts(entries);
  expect(violations).toHaveLength(1);
  expect(violations[0].reason).toContain('unexpected process');
});
