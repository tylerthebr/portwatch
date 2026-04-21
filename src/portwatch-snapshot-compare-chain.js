// portwatch-snapshot-compare-chain.js
// Compare a sequence of snapshots to build a chain of diffs over time

const { loadHistory } = require('./history');
const { diffSnapshots } = require('./snapshot');
const { formatTimestamp } = require('./formatter');

function buildCompareChain(history) {
  if (!Array.isArray(history) || history.length < 2) return [];

  const chain = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const diff = diffSnapshots(prev.ports || [], curr.ports || []);
    chain.push({
      from: prev.timestamp,
      to: curr.timestamp,
      added: diff.added.length,
      removed: diff.removed.length,
      unchanged: diff.unchanged ? diff.unchanged.length : 0,
      diff
    });
  }
  return chain;
}

function getChainSummary(chain) {
  if (!chain.length) return { totalAdded: 0, totalRemoved: 0, steps: 0 };
  return {
    steps: chain.length,
    totalAdded: chain.reduce((s, c) => s + c.added, 0),
    totalRemoved: chain.reduce((s, c) => s + c.removed, 0),
    mostActiveStep: chain.reduce((a, b) =>
      (a.added + a.removed) >= (b.added + b.removed) ? a : b
    )
  };
}

function formatCompareChain(chain) {
  if (!chain.length) return 'No chain data available.';
  return chain.map((step, i) =>
    `Step ${i + 1}: ${formatTimestamp(step.from)} → ${formatTimestamp(step.to)} | +${step.added} -${step.removed}`
  ).join('\n');
}

function buildChainFromHistory() {
  const history = loadHistory();
  return buildCompareChain(history);
}

module.exports = {
  buildCompareChain,
  getChainSummary,
  formatCompareChain,
  buildChainFromHistory
};
