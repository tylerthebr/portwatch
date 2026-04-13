/**
 * portwatch-search.js
 * Full-text and field-based search across port snapshots and history.
 * Supports fuzzy matching on process names, exact port lookups, and
 * multi-field queries with optional result ranking.
 */

'use strict';

/**
 * Normalize a string for case-insensitive comparison.
 * @param {string} s
 * @returns {string}
 */
function normalize(s) {
  return String(s || '').toLowerCase().trim();
}

/**
 * Check whether a single entry matches a parsed query object.
 * Supported fields: port, protocol, process, state, tag, label
 *
 * @param {object} entry
 * @param {object} query  - { field, value, fuzzy }
 * @returns {boolean}
 */
function matchesField(entry, query) {
  const { field, value, fuzzy } = query;
  const needle = normalize(value);

  const candidates = [];

  if (!field || field === 'port') {
    candidates.push(String(entry.port || ''));
  }
  if (!field || field === 'protocol') {
    candidates.push(normalize(entry.protocol));
  }
  if (!field || field === 'process') {
    candidates.push(normalize(entry.process));
  }
  if (!field || field === 'state') {
    candidates.push(normalize(entry.state));
  }
  if (!field || field === 'label') {
    candidates.push(normalize(entry.label));
  }
  if (!field || field === 'tag') {
    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    tags.forEach(t => candidates.push(normalize(t)));
  }

  return candidates.some(c =>
    fuzzy ? c.includes(needle) : c === needle
  );
}

/**
 * Parse a raw search string into an array of query tokens.
 * Supports:
 *   - bare terms:        "nginx"         → fuzzy match across all fields
 *   - field:value pairs: "process:node"  → exact field match
 *   - port numbers:      "3000"          → exact port match
 *
 * @param {string} raw
 * @returns {Array<{field: string|null, value: string, fuzzy: boolean}>}
 */
function parseSearchQuery(raw) {
  if (!raw || typeof raw !== 'string') return [];

  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(token => {
      const colonIdx = token.indexOf(':');
      if (colonIdx > 0) {
        const field = token.slice(0, colonIdx).toLowerCase();
        const value = token.slice(colonIdx + 1);
        return { field, value, fuzzy: false };
      }
      // bare number → exact port
      if (/^\d+$/.test(token)) {
        return { field: 'port', value: token, fuzzy: false };
      }
      return { field: null, value: token, fuzzy: true };
    });
}

/**
 * Search an array of port entries using a raw query string.
 * All tokens must match (AND semantics).
 *
 * @param {object[]} entries
 * @param {string}   raw      - e.g. "process:node port:3000" or "nginx"
 * @returns {object[]}
 */
function searchEntries(entries, raw) {
  if (!Array.isArray(entries)) return [];
  const tokens = parseSearchQuery(raw);
  if (tokens.length === 0) return entries.slice();

  return entries.filter(entry =>
    tokens.every(token => matchesField(entry, token))
  );
}

/**
 * Score an entry against a query (higher = better match).
 * Used for ranking results when fuzzy search returns many hits.
 *
 * @param {object} entry
 * @param {string} raw
 * @returns {number}
 */
function scoreEntry(entry, raw) {
  const tokens = parseSearchQuery(raw);
  let score = 0;
  for (const token of tokens) {
    const needle = normalize(token.value);
    // Exact process name match is highest value
    if (normalize(entry.process) === needle) score += 10;
    else if (normalize(entry.process).includes(needle)) score += 5;
    // Exact port match
    if (String(entry.port) === token.value) score += 8;
    // Label / tag partial
    if (normalize(entry.label).includes(needle)) score += 3;
  }
  return score;
}

/**
 * Search and return results sorted by relevance score (descending).
 *
 * @param {object[]} entries
 * @param {string}   raw
 * @returns {object[]}
 */
function rankedSearch(entries, raw) {
  const hits = searchEntries(entries, raw);
  return hits.sort((a, b) => scoreEntry(b, raw) - scoreEntry(a, raw));
}

module.exports = {
  parseSearchQuery,
  matchesField,
  searchEntries,
  scoreEntry,
  rankedSearch,
};
