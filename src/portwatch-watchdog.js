// portwatch-watchdog.js
// Monitors port entries against expected state and fires alerts on violations

const { loadWatchlist } = require('./watchlist');
const { loadIgnoreList } = require('./ignore');
const { emitEvent } = require('./portevents');
const { shouldFire } = require('./throttle');

const WATCHDOG_KEY = 'watchdog';

/**
 * Check if a port entry violates any watchlist expectation.
 * Returns a violation object or null.
 */
function checkViolation(entry, watchlist) {
  const watched = watchlist.find(w => w.port === entry.port);
  if (!watched) return null;

  if (watched.expectedProcess && entry.process !== watched.expectedProcess) {
    return {
      type: 'process_mismatch',
      port: entry.port,
      expected: watched.expectedProcess,
      actual: entry.process,
    };
  }

  if (watched.expectedProtocol && entry.protocol !== watched.expectedProtocol) {
    return {
      type: 'protocol_mismatch',
      port: entry.port,
      expected: watched.expectedProtocol,
      actual: entry.protocol,
    };
  }

  return null;
}

/**
 * Run the watchdog against a list of current port entries.
 * Returns an array of violations found.
 */
function runWatchdog(entries) {
  const watchlist = loadWatchlist();
  const ignoreList = loadIgnoreList();

  const ignoredPorts = new Set(ignoreList.map(i => i.port));
  const filtered = entries.filter(e => !ignoredPorts.has(e.port));

  const violations = [];

  for (const entry of filtered) {
    const violation = checkViolation(entry, watchlist);
    if (violation) {
      violations.push(violation);
    }
  }

  return violations;
}

/**
 * Emit watchdog events for each violation, respecting throttle.
 */
function dispatchViolations(violations) {
  for (const v of violations) {
    const key = `${WATCHDOG_KEY}:${v.type}:${v.port}`;
    if (shouldFire(key)) {
      emitEvent('watchdog:violation', v);
    }
  }
  return violations.length;
}

/**
 * Format a single violation for display.
 */
function formatViolation(v) {
  if (v.type === 'process_mismatch') {
    return `[WATCHDOG] Port ${v.port}: expected process "${v.expected}", got "${v.actual}"`;
  }
  if (v.type === 'protocol_mismatch') {
    return `[WATCHDOG] Port ${v.port}: expected protocol "${v.expected}", got "${v.actual}"`;
  }
  return `[WATCHDOG] Port ${v.port}: unknown violation`;
}

module.exports = { checkViolation, runWatchdog, dispatchViolations, formatViolation };
