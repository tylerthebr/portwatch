const path = require('path');
const fs = require('fs');
const os = require('os');
const { listPlugins, loadPlugin, runPluginHook, runAllPluginHooks, getPluginDir } = require('./plugin');

jest.mock('./config', () => ({
  loadConfig: jest.fn(() => ({ pluginDir: '/tmp/portwatch-test-plugins' }))
}));

const TEST_PLUGIN_DIR = '/tmp/portwatch-test-plugins';

beforeEach(() => {
  if (!fs.existsSync(TEST_PLUGIN_DIR)) fs.mkdirSync(TEST_PLUGIN_DIR, { recursive: true });
});

afterEach(() => {
  fs.readdirSync(TEST_PLUGIN_DIR).forEach(f => fs.unlinkSync(path.join(TEST_PLUGIN_DIR, f)));
});

test('listPlugins returns empty array when no plugins', () => {
  expect(listPlugins()).toEqual([]);
});

test('listPlugins returns plugin names without extension', () => {
  fs.writeFileSync(path.join(TEST_PLUGIN_DIR, 'myplugin.js'), 'module.exports = {};');
  expect(listPlugins()).toContain('myplugin');
});

test('loadPlugin throws if plugin does not exist', () => {
  expect(() => loadPlugin('nonexistent')).toThrow('Plugin not found: nonexistent');
});

test('loadPlugin returns module if plugin exists', () => {
  const pluginPath = path.join(TEST_PLUGIN_DIR, 'hello.js');
  fs.writeFileSync(pluginPath, 'module.exports = { onScan: (p) => p };');
  delete require.cache[pluginPath];
  const plugin = loadPlugin('hello');
  expect(typeof plugin.onScan).toBe('function');
});

test('runPluginHook returns null if hook not defined', () => {
  const pluginPath = path.join(TEST_PLUGIN_DIR, 'nohook.js');
  fs.writeFileSync(pluginPath, 'module.exports = {};');
  delete require.cache[pluginPath];
  const result = runPluginHook('nohook', 'onScan', {});
  expect(result).toBeNull();
});

test('runAllPluginHooks collects results from all plugins', () => {
  const p1 = path.join(TEST_PLUGIN_DIR, 'plug1.js');
  fs.writeFileSync(p1, 'module.exports = { onDiff: () => "plug1-result" };');
  delete require.cache[p1];
  const results = runAllPluginHooks('onDiff', {});
  expect(results.some(r => r.plugin === 'plug1' && r.result === 'plug1-result')).toBe(true);
});

test('getPluginDir returns value from config', () => {
  expect(getPluginDir()).toBe(TEST_PLUGIN_DIR);
});
