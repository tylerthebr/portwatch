const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');

const PID_FILE = path.join(require('os').homedir(), '.portwatch', 'daemon.pid');

function writePid() {
  const dir = path.dirname(PID_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
}

function readPid() {
  if (!fs.existsSync(PID_FILE)) return null;
  const raw = fs.readFileSync(PID_FILE, 'utf8').trim();
  const pid = parseInt(raw, 10);
  return isNaN(pid) ? null : pid;
}

function clearPid() {
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
}

function isDaemonRunning() {
  const pid = readPid();
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    clearPid();
    return false;
  }
}

function stopDaemon() {
  const pid = readPid();
  if (!pid) return { stopped: false, reason: 'no pid file found' };
  try {
    process.kill(pid, 'SIGTERM');
    clearPid();
    return { stopped: true, pid };
  } catch (err) {
    clearPid();
    return { stopped: false, reason: err.message };
  }
}

function getDaemonStatus() {
  const pid = readPid();
  const running = isDaemonRunning();
  return { running, pid: running ? pid : null, pidFile: PID_FILE };
}

module.exports = { writePid, readPid, clearPid, isDaemonRunning, stopDaemon, getDaemonStatus, PID_FILE };
