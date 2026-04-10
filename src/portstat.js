const { execSync } = require('child_process');
const os = require('os');

/**
 * Get connection count for a specific port
 */
function getConnectionCount(port) {
  try {
    const platform = os.platform();
    let cmd;
    if (platform === 'darwin' || platform === 'linux') {
      cmd = `lsof -i :${port} | grep -c ESTABLISHED || true`;
    } else {
      return null;
    }
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    return parseInt(result, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Get basic stats for a port entry
 */
function getPortStat(entry) {
  const connections = getConnectionCount(entry.port);
  return {
    port: entry.port,
    protocol: entry.protocol || 'tcp',
    process: entry.process || 'unknown',
    pid: entry.pid || null,
    connections,
    timestamp: Date.now()
  };
}

/**
 * Enrich an array of port entries with stat info
 */
function enrichWithStats(entries) {
  return entries.map(entry => ({
    ...entry,
    stat: getPortStat(entry)
  }));
}

/**
 * Summarize stats across all entries
 */
function summarizeStats(entries) {
  const stats = entries.map(e => e.stat || getPortStat(e));
  const totalConnections = stats.reduce((sum, s) => sum + (s.connections || 0), 0);
  const busiest = stats.sort((a, b) => b.connections - a.connections)[0] || null;
  return {
    totalPorts: entries.length,
    totalConnections,
    busiestPort: busiest ? busiest.port : null,
    busiestProcess: busiest ? busiest.process : null,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { getConnectionCount, getPortStat, enrichWithStats, summarizeStats };
