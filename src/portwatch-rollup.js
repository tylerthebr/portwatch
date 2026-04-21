// portwatch-rollup.js — aggregate multiple snapshots into a summary rollup

const { loadHistory } = require('./history');
const { buildFrequencyMap } = require('./porttrend');

function buildRollup(historyEntries, windowMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = historyEntries.filter(e => new Date(e.timestamp).getTime() >= cutoff);

  const allPorts = recent.flatMap(e => e.ports || []);
  const freqMap = buildFrequencyMap(recent);

  const uniquePorts = [...new Set(allPorts.map(p => p.port))];
  const totalSnapshots = recent.length;

  const portSummaries = uniquePorts.map(port => {
    const appearances = freqMap[port] || 0;
    const entries = allPorts.filter(p => p.port === port);
    const processes = [...new Set(entries.map(p => p.process).filter(Boolean))];
    return { port, appearances, totalSnapshots, processes };
  });

  portSummaries.sort((a, b) => b.appearances - a.appearances);

  return {
    windowMs,
    totalSnapshots,
    uniquePortCount: uniquePorts.length,
    generatedAt: new Date().toISOString(),
    ports: portSummaries
  };
}

function formatRollup(rollup) {
  const lines = [];
  const hrs = Math.round(rollup.windowMs / 3600000);
  lines.push(`Port Rollup — last ${hrs}h (${rollup.totalSnapshots} snapshots, ${rollup.uniquePortCount} unique ports)`);
  lines.push('');
  for (const p of rollup.ports.slice(0, 20)) {
    const pct = rollup.totalSnapshots > 0
      ? Math.round((p.appearances / rollup.totalSnapshots) * 100)
      : 0;
    const procs = p.processes.length ? ` [${p.processes.join(', ')}]` : '';
    lines.push(`  :${p.port}  seen ${p.appearances}/${rollup.totalSnapshots} (${pct}%)${procs}`);
  }
  return lines.join('\n');
}

function buildRollupFromHistory(windowMs) {
  const history = loadHistory();
  return buildRollup(history, windowMs);
}

module.exports = { buildRollup, formatRollup, buildRollupFromHistory };
