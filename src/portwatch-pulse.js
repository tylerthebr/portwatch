/**
 * portwatch-pulse.js
 * Tracks how frequently each port appears across history snapshots,
 * producing a "pulse" score representing port activity level.
 */

'use strict';

const { loadHistory } = require('./history');

/**
 * Build a pulse map: port -> { count, firstSeen, lastSeen }
 * @param {Array} history - array of history entries
 * @returns {Object}
 */
function buildPulseMap(history) {
  const map = {};
  for (const entry of history) {
    const ports = entry.ports || [];
    for (const p of ports) {
      const key = String(p.port);
      if (!map[key]) {
        map[key] = { port: p.port, process: p.process || null, count: 0, firstSeen: entry.timestamp, lastSeen: entry.timestamp };
      }
      map[key].count += 1;
      if (entry.timestamp < map[key].firstSeen) map[key].firstSeen = entry.timestamp;
      if (entry.timestamp > map[key].lastSeen) map[key].lastSeen = entry.timestamp;
    }
  }
  return map;
}

/**
 * Score a port's pulse: count / totalSnapshots (0..1)
 * @param {Object} pulseEntry
 * @param {number} totalSnapshots
 * @returns {number}
 */
function scorePulse(pulseEntry, totalSnapshots) {
  if (!totalSnapshots) return 0;
  return Math.min(1, pulseEntry.count / totalSnapshots);
}

/**
 * Build full pulse report from history
 * @param {Array} history
 * @returns {Array} sorted by score desc
 */
function buildPulseReport(history) {
  const total = history.length;
  const map = buildPulseMap(history);
  return Object.values(map)
    .map(entry => ({
      ...entry,
      score: parseFloat(scorePulse(entry, total).toFixed(3))
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Format pulse report for CLI output
 * @param {Array} report
 * @returns {string}
 */
function formatPulseReport(report) {
  if (!report.length) return 'No pulse data available.';
  const lines = ['PORT\t\tSCORE\tCOUNT\tPROCESS'];
  for (const r of report) {
    const proc = r.process || '-';
    lines.push(`${r.port}\t\t${r.score}\t${r.count}\t${proc}`);
  }
  return lines.join('\n');
}

module.exports = { buildPulseMap, scorePulse, buildPulseReport, formatPulseReport };
