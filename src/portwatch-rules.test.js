const {
  loadRules,
  saveRules,
  addRule,
  removeRule,
  evaluateRule,
  evaluateAll
} = require('./portwatch-rules');

jest.mock('./config', () => ({
  ensureConfigDir: () => '/tmp/portwatch-test-rules'
}));

jest.mock('fs', () => {
  const store = {};
  return {
    existsSync: p => !!store[p],
    readFileSync: p => store[p],
    writeFileSync: (p, d) => { store[p] = d; },
    _store: store
  };
});

beforeEach(() => {
  const fs = require('fs');
  Object.keys(fs._store).forEach(k => delete fs._store[k]);
});

test('loadRules returns empty array if no file', () => {
  expect(loadRules()).toEqual([]);
});

test('addRule stores a rule', () => {
  const rule = addRule({ id: 'r1', type: 'port_open', port: 3000 });
  expect(rule.id).toBe('r1');
  const rules = loadRules();
  expect(rules).toHaveLength(1);
  expect(rules[0].createdAt).toBeDefined();
});

test('addRule throws on duplicate id', () => {
  addRule({ id: 'r2', type: 'port_open', port: 8080 });
  expect(() => addRule({ id: 'r2', type: 'port_open', port: 8080 })).toThrow();
});

test('removeRule removes by id', () => {
  addRule({ id: 'r3', type: 'port_open', port: 4000 });
  removeRule('r3');
  expect(loadRules()).toHaveLength(0);
});

test('removeRule throws if not found', () => {
  expect(() => removeRule('ghost')).toThrow();
});

test('evaluateRule port_open matches correctly', () => {
  const rule = { type: 'port_open', port: 3000 };
  expect(evaluateRule(rule, { port: 3000 })).toBe(true);
  expect(evaluateRule(rule, { port: 3001 })).toBe(false);
});

test('evaluateRule port_range matches correctly', () => {
  const rule = { type: 'port_range', min: 3000, max: 3999 };
  expect(evaluateRule(rule, { port: 3500 })).toBe(true);
  expect(evaluateRule(rule, { port: 4000 })).toBe(false);
});

test('evaluateRule process_match works', () => {
  const rule = { type: 'process_match', process: 'node' };
  expect(evaluateRule(rule, { port: 3000, process: 'node server.js' })).toBe(true);
  expect(evaluateRule(rule, { port: 3000, process: 'python app.py' })).toBe(false);
});

test('evaluateAll returns triggered rules with matches', () => {
  const rules = [{ id: 'r1', type: 'port_open', port: 8080 }];
  const entries = [{ port: 8080, process: 'nginx' }, { port: 3000, process: 'node' }];
  const result = evaluateAll(rules, entries);
  expect(result).toHaveLength(1);
  expect(result[0].matches).toHaveLength(1);
});

test('evaluateAll returns empty when no matches', () => {
  const rules = [{ id: 'r1', type: 'port_open', port: 9999 }];
  const entries = [{ port: 3000 }];
  expect(evaluateAll(rules, entries)).toHaveLength(0);
});
