const { loadHistory } = require('./history');
const { buildFrequencyMap } = require('./porttrend');

/**
 * Score how anomalous a port is based on historical frequency.
 * Returns a value between 0 (normal) and 1 (never seen before).
 */
function scoreAnomaly(port, freqMap, totalSnapshots) {
  if (totalSnapshots === 0) return 0;
  const count = freqMap[port] || 0;
  return parseFloat((1 - count / totalSnapshots).toFixed(4));
}

/**
 * Detect anomalous ports in a current snapshot by comparing to history.
 * Returns entries with an anomalyScore attached.
 */
function detectAnomalies(currentEntries, history, threshold = 0.8) {
  const totalSnapshots = history.length;
  const freqMap = buildFrequencyMap(history);

  return currentEntries
    .map(entry => ({
      ...entry,
      anomalyScore: scoreAnomaly(String(entry.port), freqMap, totalSnapshots)
    }))
    .filter(entry => entry.anomalyScore >= threshold);
}

/**
 * Build a full anomaly report from history file + current entries.
 */
function buildAnomalyReport(currentEntries, history, threshold = 0.8) {
  const anomalies = detectAnomalies(currentEntries, history, threshold);
  return {
    timestamp: new Date().toISOString(),
    threshold,
    total: currentEntries.length,
    anomalyCount: anomalies.length,
    anomalies
  };
}

/**
 * Format an anomaly report as a human-readable string.
 */
function formatAnomalyReport(report) {
  if (report.anomalyCount === 0) {
    return `[anomaly] No anomalies detected (threshold: ${report.threshold})`;
  }
  const lines = [
    `[anomaly] ${report.anomalyCount} anomalous port(s) detected (threshold: ${report.threshold}):`,
    ...report.anomalies.map(
      e => `  port=${e.port} process=${e.process || 'unknown'} score=${e.anomalyScore}`
    )
  ];
  return lines.join('\n');
}

module.exports = { scoreAnomaly, detectAnomalies, buildAnomalyReport, formatAnomalyReport };
