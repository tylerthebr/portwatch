const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('./config', () => ({
  ensureConfigDir: () => require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'pw-ruleset-'))
}));

let tmpDir;
beforeEach(() => {
  jest.resetModules();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ruleset-'));
  jest.mock('./config', () => ({ ensureConfigDir: () => tmpDir }));
});

const load = () => require('./portwatch-ruleset');

test('loadRulesets returns empty object when no file', () => {
  const { loadRulesets } = load();
  expect(loadRulesets()).toEqual({});
});

test('addRuleset creates a new ruleset', () => {
  const { addRuleset, getRuleset } = load();
  addRuleset('dev', [{ port: 3000 }]);
  const rs = getRuleset('dev');
  expect(rs).not.toBeNull();
  expect(rs.name).toBe('dev');
  expect(rs.rules).toEqual([{ port: 3000 }]);
});

test('addRuleset throws if name is missing', () => {
  const { addRuleset } = load();
  expect(() => addRuleset('')).toThrow('Ruleset name required');
});

test('removeRuleset removes existing ruleset', () => {
  const { addRuleset, removeRuleset, getRuleset } = load();
  addRuleset('staging');
  expect(removeRuleset('staging')).toBe(true);
  expect(getRuleset('staging')).toBeNull();
});

test('removeRuleset returns false for unknown ruleset', () => {
  const { removeRuleset } = load();
  expect(removeRuleset('ghost')).toBe(false);
});

test('listRulesets returns all rulesets', () => {
  const { addRuleset, listRulesets } = load();
  addRuleset('a');
  addRuleset('b');
  const list = listRulesets();
  expect(list.length).toBe(2);
  expect(list.map(r => r.name)).toContain('a');
});

test('applyRuleset filters entries by port rule', () => {
  const { addRuleset, applyRuleset } = load();
  addRuleset('only3000', [{ port: 3000 }]);
  const entries = [
    { port: 3000, protocol: 'tcp', process: 'node' },
    { port: 5432, protocol: 'tcp', process: 'postgres' }
  ];
  const result = applyRuleset('only3000', entries);
  expect(result).toHaveLength(1);
  expect(result[0].port).toBe(3000);
});

test('applyRuleset returns all entries for unknown ruleset', () => {
  const { applyRuleset } = load();
  const entries = [{ port: 8080 }];
  expect(applyRuleset('nope', entries)).toEqual(entries);
});
