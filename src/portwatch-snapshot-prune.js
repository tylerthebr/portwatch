const fs = require('fs');
const path = require('path');
const { loadHistory } = require('./history');
const { saveHistory } = require('./history');

const DEFAULT_MAX_AGE_DAYS = 30;
const DEFAULT_MAX_COUNT = 100;

function getPruneConfig(config = {}) {
  return {
    maxAgeDays: config.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS,
    maxCount: config.maxCount ?? DEFAULT_MAX_COUNT,
  };
}

function pruneByAge(entries, maxAgeDays) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  return entries.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

function pruneByCount(entries, maxCount) {
  if (entries.length <= maxCount) return entries;
  return entries.slice(entries.length - maxCount);
}

function pruneHistory(entries, config = {}) {
  const { maxAgeDays, maxCount } = getPruneConfig(config);
  let pruned = pruneByAge(entries, maxAgeDays);
  pruned = pruneByCount(pruned, maxCount);
  return pruned;
}

function buildPruneReport(before, after) {
  const removed = before.length - after.length;
  return {
    before: before.length,
    after: after.length,
    removed,
    oldest: after.length ? after[0].timestamp : null,
    newest: after.length ? after[after.length - 1].timestamp : null,
  };
}

function formatPruneReport(report) {
  const lines = [
    `Prune complete:`,
    `  Entries before : ${report.before}`,
    `  Entries after  : ${report.after}`,
    `  Removed        : ${report.removed}`,
  ];
  if (report.oldest) lines.push(`  Oldest kept    : ${report.oldest}`);
  if (report.newest) lines.push(`  Newest kept    : ${report.newest}`);
  return lines.join('\n');
}

module.exports = {
  getPruneConfig,
  pruneByAge,
  pruneByCount,
  pruneHistory,
  buildPruneReport,
  formatPruneReport,
};
