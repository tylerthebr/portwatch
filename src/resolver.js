/**
 * resolver.js
 * Resolves process names and PIDs from raw port scan entries.
 */

const { execSync } = require('child_process');

/**
 * Attempt to resolve a human-readable process name from a PID.
 * @param {number|string} pid
 * @returns {string|null}
 */
function resolveProcessName(pid) {
  if (!pid || pid === '-') return null;
  try {
    const result = execSync(`ps -p ${pid} -o comm=`, { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return result || null;
  } catch {
    return null;
  }
}

/**
 * Enrich a port entry with a resolved process name if missing.
 * @param {{ pid?: string|number, process?: string, [key: string]: any }} entry
 * @returns {object}
 */
function enrichEntry(entry) {
  if (entry.process && entry.process !== '-') return entry;

  const resolved = resolveProcessName(entry.pid);
  return {
    ...entry,
    process: resolved || entry.process || 'unknown',
  };
}

/**
 * Enrich an array of port entries.
 * @param {object[]} entries
 * @returns {object[]}
 */
function enrichEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(enrichEntry);
}

/**
 * Build a display label for a port entry.
 * @param {{ port: number|string, protocol?: string, process?: string, pid?: string|number }} entry
 * @returns {string}
 */
function buildLabel(entry) {
  const proto = entry.protocol ? entry.protocol.toUpperCase() : 'TCP';
  const proc = entry.process && entry.process !== 'unknown' ? ` (${entry.process})` : '';
  return `${proto}:${entry.port}${proc}`;
}

module.exports = { resolveProcessName, enrichEntry, enrichEntries, buildLabel };
