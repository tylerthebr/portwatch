// portwatch-badge.js — generate status badges for port monitoring state

const { getDaemonStatus } = require('./portwatch-status');
const { loadSnapshot } = require('./snapshot');
const { getStaleEntries } = require('./portexpiry');

const BADGE_COLORS = {
  ok: 'brightgreen',
  warning: 'yellow',
  error: 'red',
  inactive: 'lightgrey',
  info: 'blue'
};

function buildBadgeData(label, message, color) {
  return { schemaVersion: 1, label, message, color };
}

function getStatusBadge() {
  const daemon = getDaemonStatus();
  if (!daemon.running) {
    return buildBadgeData('portwatch', 'inactive', BADGE_COLORS.inactive);
  }
  return buildBadgeData('portwatch', 'running', BADGE_COLORS.ok);
}

function getPortCountBadge(snapshot) {
  const entries = snapshot || loadSnapshot();
  if (!entries || entries.length === 0) {
    return buildBadgeData('ports', 'none', BADGE_COLORS.inactive);
  }
  const color = entries.length > 50 ? BADGE_COLORS.warning : BADGE_COLORS.info;
  return buildBadgeData('ports', String(entries.length), color);
}

function getStaleBadge(snapshot, maxAgeMs = 3600000) {
  const entries = snapshot || loadSnapshot();
  if (!entries || entries.length === 0) {
    return buildBadgeData('stale ports', '0', BADGE_COLORS.ok);
  }
  const stale = getStaleEntries(entries, maxAgeMs);
  const color = stale.length > 0 ? BADGE_COLORS.warning : BADGE_COLORS.ok;
  return buildBadgeData('stale ports', String(stale.length), color);
}

function formatBadgeJSON(badgeData) {
  return JSON.stringify(badgeData, null, 2);
}

function formatBadgeSVG(badgeData) {
  const { label, message, color } = badgeData;
  const lw = label.length * 7 + 10;
  const mw = message.length * 7 + 10;
  const tw = lw + mw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20">
  <rect width="${lw}" height="20" fill="#555"/>
  <rect x="${lw}" width="${mw}" height="20" fill="${color}"/>
  <text x="${lw / 2}" y="14" fill="#fff" font-size="11" text-anchor="middle">${label}</text>
  <text x="${lw + mw / 2}" y="14" fill="#fff" font-size="11" text-anchor="middle">${message}</text>
</svg>`;
}

module.exports = {
  buildBadgeData,
  getStatusBadge,
  getPortCountBadge,
  getStaleBadge,
  formatBadgeJSON,
  formatBadgeSVG
};
