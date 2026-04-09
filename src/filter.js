/**
 * filter.js
 * Utilities for filtering port scan results by range, protocol, or process name.
 */

/**
 * Filter ports by a numeric range (inclusive).
 * @param {Array<{port: number, protocol: string, pid: string, process: string}>} ports
 * @param {number} min
 * @param {number} max
 * @returns {Array}
 */
function filterByRange(ports, min, max) {
  if (min == null && max == null) return ports;
  return ports.filter((entry) => {
    const p = entry.port;
    if (min != null && p < min) return false;
    if (max != null && p > max) return false;
    return true;
  });
}

/**
 * Filter ports by protocol (tcp / udp), case-insensitive.
 * @param {Array} ports
 * @param {string} protocol
 * @returns {Array}
 */
function filterByProtocol(ports, protocol) {
  if (!protocol) return ports;
  const proto = protocol.toLowerCase();
  return ports.filter((entry) => entry.protocol.toLowerCase() === proto);
}

/**
 * Filter ports by process name substring match, case-insensitive.
 * @param {Array} ports
 * @param {string} processName
 * @returns {Array}
 */
function filterByProcess(ports, processName) {
  if (!processName) return ports;
  const name = processName.toLowerCase();
  return ports.filter((entry) =>
    (entry.process || '').toLowerCase().includes(name)
  );
}

/**
 * Apply all filters from a config object at once.
 * @param {Array} ports
 * @param {{ minPort?: number, maxPort?: number, protocol?: string, process?: string }} opts
 * @returns {Array}
 */
function applyFilters(ports, opts = {}) {
  let result = ports;
  result = filterByRange(result, opts.minPort, opts.maxPort);
  result = filterByProtocol(result, opts.protocol);
  result = filterByProcess(result, opts.process);
  return result;
}

module.exports = { filterByRange, filterByProtocol, filterByProcess, applyFilters };
