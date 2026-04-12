// portquery.js — query port entries with filter expressions

const { applyFilters } = require('./filter');
const { getPortEntry } = require('./portmap');

/**
 * Parse a simple query string into filter options.
 * Supports: port=3000, proto=tcp, process=node, range=3000-4000
 */
function parseQuery(queryStr) {
  const opts = {};
  if (!queryStr || typeof queryStr !== 'string') return opts;

  const parts = queryStr.split(/\s+/);
  for (const part of parts) {
    const [key, val] = part.split('=');
    if (!key || !val) continue;
    switch (key.trim().toLowerCase()) {
      case 'port':
        opts.port = parseInt(val, 10);
        break;
      case 'proto':
      case 'protocol':
        opts.protocol = val.trim().toLowerCase();
        break;
      case 'process':
      case 'proc':
        opts.process = val.trim();
        break;
      case 'range': {
        const [lo, hi] = val.split('-').map(Number);
        if (!isNaN(lo) && !isNaN(hi)) opts.range = [lo, hi];
        break;
      }
    }
  }
  return opts;
}

/**
 * Run a query against a list of port entries.
 * Returns matched entries.
 */
function queryPorts(entries, queryStr) {
  if (!Array.isArray(entries)) return [];
  const opts = parseQuery(queryStr);

  let results = applyFilters(entries, opts);

  if (opts.port !== undefined) {
    results = results.filter(e => e.port === opts.port);
  }

  return results;
}

/**
 * Look up a single port entry from a portmap by port number.
 */
function lookupPort(portMap, port) {
  return getPortEntry(portMap, port) || null;
}

/**
 * Check whether a port matches a set of filter criteria.
 */
function matchesQuery(entry, queryStr) {
  return queryPorts([entry], queryStr).length > 0;
}

module.exports = { parseQuery, queryPorts, lookupPort, matchesQuery };
