// portwatch-spotlight.js — highlight ports of interest across snapshots

const { loadHistory } = require('./history');
const { getLabelForPort } = require('./portlabel');
const { getAlias } = require('./portaliases');

function buildSpotlightIndex(history) {
  const index = {};
  for (const entry of history) {
    for (const port of entry.ports || []) {
      const key = `${port.port}/${port.protocol}`;
      if (!index[key]) {
        index[key] = { port: port.port, protocol: port.protocol, seenCount: 0, processes: new Set(), firstSeen: entry.timestamp, lastSeen: entry.timestamp };
      }
      index[key].seenCount++;
      if (port.process) index[key].processes.add(port.process);
      if (entry.timestamp > index[key].lastSeen) index[key].lastSeen = entry.timestamp;
      if (entry.timestamp < index[key].firstSeen) index[key].firstSeen = entry.timestamp;
    }
  }
  return Object.values(index).map(e => ({ ...e, processes: [...e.processes] }));
}

function spotlightPort(port, history) {
  const all = buildSpotlightIndex(history);
  return all.find(e => e.port === port) || null;
}

function topSpotlightPorts(history, n = 10) {
  const index = buildSpotlightIndex(history);
  return index.sort((a, b) => b.seenCount - a.seenCount).slice(0, n);
}

function formatSpotlight(entry) {
  const label = getLabelForPort(entry.port) || getAlias(entry.port) || '';
  const tag = label ? ` (${label})` : '';
  return [
    `Port: ${entry.port}/${entry.protocol}${tag}`,
    `  Seen: ${entry.seenCount} time(s)`,
    `  Processes: ${entry.processes.join(', ') || 'unknown'}`,
    `  First seen: ${new Date(entry.firstSeen).toLocaleString()}`,
    `  Last seen:  ${new Date(entry.lastSeen).toLocaleString()}`,
  ].join('\n');
}

module.exports = { buildSpotlightIndex, spotlightPort, topSpotlightPorts, formatSpotlight };
