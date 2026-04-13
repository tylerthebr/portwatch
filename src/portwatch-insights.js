// portwatch-insights.js
// Derives actionable insights from port history and metrics

const { loadHistory } = require('./history');
const { buildFrequencyMap, topPorts } = require('./porttrend');
const { calcUptimeRatios } = require('./portmetrics');

const INSIGHT_TYPES = {
  ALWAYS_ON: 'always_on',
  FREQUENTLY_OPEN: 'frequently_open',
  RARELY_SEEN: 'rarely_seen',
  RECENTLY_NEW: 'recently_new',
};

function buildInsights(history, opts = {}) {
  const { topN = 5, rareThreshold = 0.1, frequentThreshold = 0.7 } = opts;

  if (!history || history.length === 0) return [];

  const allEntries = history.flatMap(h => h.ports || []);
  const freqMap = buildFrequencyMap(history);
  const uptimeMap = calcUptimeRatios(history);
  const insights = [];

  for (const [port, ratio] of Object.entries(uptimeMap)) {
    const portNum = parseInt(port, 10);
    const sample = allEntries.find(e => e.port === portNum);
    const label = sample ? (sample.process || String(portNum)) : String(portNum);

    if (ratio >= 1.0) {
      insights.push({ type: INSIGHT_TYPES.ALWAYS_ON, port: portNum, label, ratio });
    } else if (ratio >= frequentThreshold) {
      insights.push({ type: INSIGHT_TYPES.FREQUENTLY_OPEN, port: portNum, label, ratio });
    } else if (ratio <= rareThreshold) {
      insights.push({ type: INSIGHT_TYPES.RARELY_SEEN, port: portNum, label, ratio });
    }
  }

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recentPorts = new Set(
    history
      .filter(h => new Date(h.timestamp).getTime() >= cutoff)
      .flatMap(h => (h.ports || []).map(e => e.port))
  );
  const olderPorts = new Set(
    history
      .filter(h => new Date(h.timestamp).getTime() < cutoff)
      .flatMap(h => (h.ports || []).map(e => e.port))
  );

  for (const port of recentPorts) {
    if (!olderPorts.has(port)) {
      const sample = allEntries.find(e => e.port === port);
      const label = sample ? (sample.process || String(port)) : String(port);
      if (!insights.find(i => i.port === port && i.type === INSIGHT_TYPES.RECENTLY_NEW)) {
        insights.push({ type: INSIGHT_TYPES.RECENTLY_NEW, port, label, ratio: uptimeMap[port] || 0 });
      }
    }
  }

  return insights.slice(0, topN * 4);
}

function formatInsights(insights) {
  if (!insights || insights.length === 0) return '  No insights available.';

  const lines = insights.map(i => {
    const pct = (i.ratio * 100).toFixed(0);
    switch (i.type) {
      case INSIGHT_TYPES.ALWAYS_ON:
        return `  [always-on]      :${i.port} (${i.label}) — up 100% of snapshots`;
      case INSIGHT_TYPES.FREQUENTLY_OPEN:
        return `  [frequent]       :${i.port} (${i.label}) — up ${pct}% of snapshots`;
      case INSIGHT_TYPES.RARELY_SEEN:
        return `  [rare]           :${i.port} (${i.label}) — seen only ${pct}% of snapshots`;
      case INSIGHT_TYPES.RECENTLY_NEW:
        return `  [new (24h)]      :${i.port} (${i.label}) — first appeared in last 24h`;
      default:
        return `  [unknown]        :${i.port}`;
    }
  });

  return lines.join('\n');
}

module.exports = { buildInsights, formatInsights, INSIGHT_TYPES };
