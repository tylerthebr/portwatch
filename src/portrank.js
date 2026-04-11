// portrank.js — ranks ports by activity, frequency, and recency

const { buildFrequencyMap } = require('./porttrend');

/**
 * Score a single port entry based on frequency, recency, and watch status.
 * @param {object} entry - port entry with port, process, timestamp fields
 * @param {object} freqMap - frequency map from buildFrequencyMap
 * @param {number} now - current timestamp in ms
 * @returns {number} score
 */
function scoreEntry(entry, freqMap, now = Date.now()) {
  const freq = freqMap[entry.port] || 0;
  const ageMs = now - (entry.timestamp || now);
  const agePenalty = Math.min(ageMs / (1000 * 60 * 60), 24); // cap at 24h
  const recencyScore = Math.max(0, 10 - agePenalty / 2.4);
  return freq * 2 + recencyScore;
}

/**
 * Rank a list of port entries from highest to lowest score.
 * @param {object[]} entries
 * @param {object[][]} history - array of past snapshots for frequency analysis
 * @param {object} options
 * @param {number} [options.topN] - limit results to top N
 * @returns {object[]} ranked entries with added `score` field
 */
function rankPorts(entries, history = [], options = {}) {
  const { topN } = options;
  const freqMap = history.length ? buildFrequencyMap(history) : {};
  const now = Date.now();

  const scored = entries.map(entry => ({
    ...entry,
    score: parseFloat(scoreEntry(entry, freqMap, now).toFixed(2))
  }));

  scored.sort((a, b) => b.score - a.score);

  return topN ? scored.slice(0, topN) : scored;
}

/**
 * Get the top-ranked port number from a list of entries.
 * @param {object[]} entries
 * @param {object[][]} history
 * @returns {number|null}
 */
function topRankedPort(entries, history = []) {
  const ranked = rankPorts(entries, history, { topN: 1 });
  return ranked.length ? ranked[0].port : null;
}

/**
 * Build a rank map: port -> rank position (1-indexed).
 * @param {object[]} entries
 * @param {object[][]} history
 * @returns {object}
 */
function buildRankMap(entries, history = []) {
  const ranked = rankPorts(entries, history);
  const map = {};
  ranked.forEach((entry, i) => {
    map[entry.port] = i + 1;
  });
  return map;
}

module.exports = { scoreEntry, rankPorts, topRankedPort, buildRankMap };
