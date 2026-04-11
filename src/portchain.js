// portchain.js — chain multiple port operations into a pipeline

const { applyFilters } = require('./filter');
const { annotateEntries } = require('./portlabel');
const { enrichEntries } = require('./resolver');
const { enrichWithStats } = require('./portstat');

/**
 * Build a chain of transform steps to apply to a port list.
 * Each step is { name, fn } where fn(entries, opts) => entries
 */
function buildChain(steps) {
  return steps.filter(Boolean);
}

/**
 * Run a chain of steps sequentially against entries.
 */
async function runChain(entries, chain, opts = {}) {
  let result = [...entries];
  for (const step of chain) {
    try {
      result = await Promise.resolve(step.fn(result, opts));
    } catch (err) {
      if (opts.strict) throw err;
      // non-strict: skip failing step
    }
  }
  return result;
}

/**
 * Create a default processing chain based on config flags.
 */
function defaultChain(opts = {}) {
  const steps = [];

  if (opts.filter) {
    steps.push({ name: 'filter', fn: (e, o) => applyFilters(e, o.filter) });
  }
  if (opts.resolve) {
    steps.push({ name: 'resolve', fn: (e) => enrichEntries(e) });
  }
  if (opts.label) {
    steps.push({ name: 'label', fn: (e) => annotateEntries(e) });
  }
  if (opts.stats) {
    steps.push({ name: 'stats', fn: (e) => enrichWithStats(e) });
  }

  return buildChain(steps);
}

/**
 * Convenience: build and run a default chain in one call.
 */
async function processEntries(entries, opts = {}) {
  const chain = defaultChain(opts);
  return runChain(entries, chain, opts);
}

module.exports = { buildChain, runChain, defaultChain, processEntries };
