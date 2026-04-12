// portwatch-status.js — aggregate runtime status snapshot

const { isRunning: isSchedulerRunning } = require('./scheduler');
const { watcherStatus } = require('./watcher');
const { isDaemonRunning, readPid } = require('./daemon');
const { loadConfig } = require('./config');
const { loadSnapshot } = require('./snapshot');
const { formatTimestamp } = require('./formatter');

function getSchedulerStatus() {
  return {
    running: isSchedulerRunning(),
    label: isSchedulerRunning() ? 'active' : 'stopped',
  };
}

function getDaemonStatus() {
  const running = isDaemonRunning();
  const pid = running ? readPid() : null;
  return { running, pid, label: running ? `active (pid ${pid})` : 'stopped' };
}

function getWatchStatus() {
  const status = watcherStatus();
  return {
    running: status.active,
    interval: status.interval ?? null,
    label: status.active ? `watching (${status.interval}ms)` : 'idle',
  };
}

async function buildStatus() {
  const config = loadConfig();
  const snapshot = loadSnapshot();
  const portCount = snapshot ? Object.keys(snapshot.ports ?? {}).length : 0;
  const snapshotAge = snapshot?.timestamp
    ? formatTimestamp(snapshot.timestamp)
    : 'none';

  return {
    daemon: getDaemonStatus(),
    scheduler: getSchedulerStatus(),
    watcher: getWatchStatus(),
    config: {
      alertsEnabled: config.alerts?.enabled ?? false,
      notificationsEnabled: config.notifications?.enabled ?? false,
      interval: config.interval ?? null,
    },
    snapshot: {
      portCount,
      lastSeen: snapshotAge,
    },
    generatedAt: new Date().toISOString(),
  };
}

function formatStatus(status) {
  const lines = [
    `portwatch status — ${status.generatedAt}`,
    '',
    `  daemon      : ${status.daemon.label}`,
    `  scheduler   : ${status.scheduler.label}`,
    `  watcher     : ${status.watcher.label}`,
    '',
    `  alerts      : ${status.config.alertsEnabled ? 'enabled' : 'disabled'}`,
    `  notify      : ${status.config.notificationsEnabled ? 'enabled' : 'disabled'}`,
    `  interval    : ${status.config.interval ?? 'not set'}`,
    '',
    `  snapshot    : ${status.snapshot.portCount} ports (last: ${status.snapshot.lastSeen})`,
  ];
  return lines.join('\n');
}

module.exports = { buildStatus, formatStatus, getDaemonStatus, getSchedulerStatus, getWatchStatus };
