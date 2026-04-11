/**
 * portmatch.js — Match ports against patterns (ranges, wildcards, named sets)
 */

const NAMED_SETS = {
  web: [80, 443, 8080, 8443, 3000, 4000, 5000],
  db: [3306, 5432, 5433, 6379, 27017, 28017],
  dev: [3000, 4000, 5000, 8000, 8080, 9000],
  mail: [25, 110, 143, 465, 587, 993, 995],
};

/**
 * Parse a pattern string into a matcher function.
 * Supports: single port "3000", range "3000-4000", wildcard "80*", named set "web"
 */
function parsePattern(pattern) {
  const str = String(pattern).trim();

  if (NAMED_SETS[str]) {
    const set = new Set(NAMED_SETS[str]);
    return (port) => set.has(Number(port));
  }

  if (str.includes('-')) {
    const [lo, hi] = str.split('-').map(Number);
    return (port) => Number(port) >= lo && Number(port) <= hi;
  }

  if (str.endsWith('*')) {
    const prefix = str.slice(0, -1);
    return (port) => String(port).startsWith(prefix);
  }

  const exact = Number(str);
  return (port) => Number(port) === exact;
}

/**
 * Returns true if the given port matches any of the provided patterns.
 */
function matchesAny(port, patterns = []) {
  return patterns.some((p) => parsePattern(p)(port));
}

/**
 * Filter a list of port entries by one or more patterns.
 */
function filterByPatterns(entries, patterns = []) {
  if (!patterns.length) return entries;
  return entries.filter((entry) => matchesAny(entry.port, patterns));
}

/**
 * Return the list of available named set keys.
 */
function getNamedSets() {
  return Object.keys(NAMED_SETS);
}

/**
 * Resolve a named set to its port list, or null if unknown.
 */
function resolveNamedSet(name) {
  return NAMED_SETS[name] || null;
}

module.exports = {
  parsePattern,
  matchesAny,
  filterByPatterns,
  getNamedSets,
  resolveNamedSet,
};
