// portwatch-env.js — detect and annotate port entries with environment context

const os = require('os');
const path = require('path');
const fs = require('fs');

const ENV_LABELS = {
  development: ['dev', 'development', 'local'],
  staging: ['staging', 'stage', 'stg'],
  production: ['prod', 'production'],
  test: ['test', 'testing', 'ci'],
};

function detectEnvFromProcess(processName = '') {
  const lower = processName.toLowerCase();
  for (const [env, keywords] of Object.entries(ENV_LABELS)) {
    if (keywords.some(k => lower.includes(k))) return env;
  }
  return null;
}

function detectEnvFromNodeEnv() {
  const val = (process.env.NODE_ENV || '').toLowerCase();
  if (!val) return null;
  for (const [env, keywords] of Object.entries(ENV_LABELS)) {
    if (keywords.includes(val)) return env;
  }
  return val;
}

function detectEnvFromDotfile(dir = process.cwd()) {
  const candidates = ['.env', '.env.local', '.env.development', '.env.staging', '.env.production'];
  for (const file of candidates) {
    const full = path.join(dir, file);
    if (fs.existsSync(full)) {
      const suffix = file.split('.env')[1]?.replace('.', '') || '';
      if (suffix) return suffix;
    }
  }
  return null;
}

function resolveEnv(entry = {}) {
  return (
    detectEnvFromProcess(entry.process || '') ||
    detectEnvFromNodeEnv() ||
    detectEnvFromDotfile() ||
    'unknown'
  );
}

function annotateWithEnv(entry) {
  return { ...entry, env: resolveEnv(entry) };
}

function annotateEntriesWithEnv(entries = []) {
  return entries.map(annotateWithEnv);
}

function groupByEnv(entries = []) {
  return entries.reduce((acc, entry) => {
    const env = entry.env || 'unknown';
    if (!acc[env]) acc[env] = [];
    acc[env].push(entry);
    return acc;
  }, {});
}

module.exports = {
  detectEnvFromProcess,
  detectEnvFromNodeEnv,
  detectEnvFromDotfile,
  resolveEnv,
  annotateWithEnv,
  annotateEntriesWithEnv,
  groupByEnv,
};
