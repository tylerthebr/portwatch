// portwatch-context.js
// Captures and manages runtime context for a portwatch session
// (hostname, user, cwd, env label, timestamp)

const os = require('os');
const path = require('path');
const { resolveEnv } = require('./portwatch-env');

function buildContext(overrides = {}) {
  return {
    hostname: os.hostname(),
    user: os.userInfo().username,
    cwd: process.cwd(),
    platform: process.platform,
    env: resolveEnv(),
    pid: process.pid,
    capturedAt: new Date().toISOString(),
    ...overrides,
  };
}

function formatContext(ctx) {
  const lines = [
    `Host     : ${ctx.hostname}`,
    `User     : ${ctx.user}`,
    `Platform : ${ctx.platform}`,
    `Env      : ${ctx.env}`,
    `CWD      : ${ctx.cwd}`,
    `PID      : ${ctx.pid}`,
    `Captured : ${ctx.capturedAt}`,
  ];
  return lines.join('\n');
}

function contextMatches(ctxA, ctxB, fields = ['hostname', 'user', 'env']) {
  return fields.every((f) => ctxA[f] === ctxB[f]);
}

function diffContexts(ctxA, ctxB) {
  const all = new Set([...Object.keys(ctxA), ...Object.keys(ctxB)]);
  const changes = [];
  for (const key of all) {
    if (ctxA[key] !== ctxB[key]) {
      changes.push({ field: key, from: ctxA[key], to: ctxB[key] });
    }
  }
  return changes;
}

module.exports = { buildContext, formatContext, contextMatches, diffContexts };
