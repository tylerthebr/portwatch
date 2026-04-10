// portping.js — check if a port is reachable/open via TCP connection attempt

const net = require('net');

const DEFAULT_TIMEOUT = 2000;

/**
 * Attempt a TCP connection to host:port.
 * Resolves with { port, host, open: true/false, latencyMs }
 */
function pingPort(port, host = '127.0.0.1', timeout = DEFAULT_TIMEOUT) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    const finish = (open) => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ port, host, open, latencyMs });
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => finish(true));
    socket.on('error', () => finish(false));
    socket.on('timeout', () => finish(false));

    socket.connect(port, host);
  });
}

/**
 * Ping multiple ports in parallel.
 * Returns array of ping results.
 */
async function pingPorts(ports, host = '127.0.0.1', timeout = DEFAULT_TIMEOUT) {
  if (!Array.isArray(ports) || ports.length === 0) return [];
  return Promise.all(ports.map((p) => pingPort(p, host, timeout)));
}

/**
 * Filter a list of port entries to only those that are reachable.
 */
async function filterReachable(entries, host = '127.0.0.1', timeout = DEFAULT_TIMEOUT) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const results = await pingPorts(entries.map((e) => e.port), host, timeout);
  const openSet = new Set(
    results.filter((r) => r.open).map((r) => r.port)
  );
  return entries.filter((e) => openSet.has(e.port));
}

module.exports = { pingPort, pingPorts, filterReachable };
