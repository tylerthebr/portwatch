const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Configuration management for PortWatch
 */

const CONFIG_DIR = path.join(os.homedir(), '.portwatch');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  alerts: {
    desktop: true,
    sound: false,
    webhook: null
  },
  watch: {
    interval: 5000,
    ports: [],
    ignoreProcesses: []
  },
  snapshot: {
    autoSave: true,
    directory: CONFIG_DIR
  }
};

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from file
 */
function loadConfig() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const userConfig = JSON.parse(content);
    
    // Deep merge with defaults
    return {
      alerts: { ...DEFAULT_CONFIG.alerts, ...userConfig.alerts },
      watch: { ...DEFAULT_CONFIG.watch, ...userConfig.watch },
      snapshot: { ...DEFAULT_CONFIG.snapshot, ...userConfig.snapshot }
    };
  } catch (error) {
    console.error('Failed to load config, using defaults:', error.message);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  ensureConfigDir();
  
  try {
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(CONFIG_FILE, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save config:', error.message);
    return false;
  }
}

/**
 * Update specific config values
 */
function updateConfig(updates) {
  const current = loadConfig();
  const updated = {
    alerts: { ...current.alerts, ...updates.alerts },
    watch: { ...current.watch, ...updates.watch },
    snapshot: { ...current.snapshot, ...updates.snapshot }
  };
  return saveConfig(updated) ? updated : current;
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
  return saveConfig(DEFAULT_CONFIG);
}

/**
 * Get config file path
 */
function getConfigPath() {
  return CONFIG_FILE;
}

module.exports = {
  loadConfig,
  saveConfig,
  updateConfig,
  resetConfig,
  getConfigPath,
  DEFAULT_CONFIG,
  CONFIG_DIR
};
