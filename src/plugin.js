const path = require('path');
const fs = require('fs');
const { loadConfig } = require('./config');

const PLUGIN_DIR_KEY = 'pluginDir';
const DEFAULT_PLUGIN_DIR = path.join(process.env.HOME || '', '.portwatch', 'plugins');

function getPluginDir() {
  const config = loadConfig();
  return config[PLUGIN_DIR_KEY] || DEFAULT_PLUGIN_DIR;
}

function listPlugins() {
  const dir = getPluginDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace(/\.js$/, ''));
}

function loadPlugin(name) {
  const dir = getPluginDir();
  const pluginPath = path.join(dir, `${name}.js`);
  if (!fs.existsSync(pluginPath)) {
    throw new Error(`Plugin not found: ${name}`);
  }
  try {
    return require(pluginPath);
  } catch (err) {
    throw new Error(`Failed to load plugin "${name}": ${err.message}`);
  }
}

function runPluginHook(name, hookName, payload) {
  let plugin;
  try {
    plugin = loadPlugin(name);
  } catch {
    return null;
  }
  if (typeof plugin[hookName] !== 'function') return null;
  return plugin[hookName](payload);
}

function runAllPluginHooks(hookName, payload) {
  const plugins = listPlugins();
  const results = [];
  for (const name of plugins) {
    const result = runPluginHook(name, hookName, payload);
    if (result !== null) results.push({ plugin: name, result });
  }
  return results;
}

module.exports = {
  getPluginDir,
  listPlugins,
  loadPlugin,
  runPluginHook,
  runAllPluginHooks
};
