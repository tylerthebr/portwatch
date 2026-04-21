// portwatch-forecast.js
// Predicts future port activity based on historical frequency patterns

const { buildFrequencyMap } = require('./porttrend');

/**
 * Calculate average appearances per snapshot window
 * @param {number[]} timestamps - sorted list of snapshot timestamps
 * @param {number} windowMs - window size in ms
 */
function calcAppearanceRate(timestamps, windowMs = 3600000) {
  if (!timestamps || timestamps.length < 2) return 0;
  const span = timestamps[timestamps.length - 1] - timestamps[0];
  if (span === 0) return 0;
  const windows = span / windowMs;
  return timestamps.length / windows;
}

/**
 * Build a forecast map: port -> { rate, predicted, confidence }
 * @param {object[]} history - array of history entries { timestamp, ports }
 * @param {object} opts
 */
function buildForecast(history, opts = {}) {
  const { windowMs = 3600000, minRate = 0.5 } = opts;
  if (!Array.isArray(history) || history.length === 0) return {};

  // Build map: port -> sorted timestamps when seen
  const seenAt = {};
  for (const entry of history) {
    const ts = new Date(entry.timestamp).getTime();
    for (const port of (entry.ports || [])) {
      const key = String(port.port);
      if (!seenAt[key]) seenAt[key] = [];
      seenAt[key].push(ts);
    }
  }

  const forecast = {};
  for (const [port, timestamps] of Object.entries(seenAt)) {
    timestamps.sort((a, b) => a - b);
    const rate = calcAppearanceRate(timestamps, windowMs);
    const confidence = Math.min(1, timestamps.length / 10);
    forecast[port] = {
      port: Number(port),
      rate: parseFloat(rate.toFixed(3)),
      predicted: rate >= minRate,
      confidence: parseFloat(confidence.toFixed(2)),
      lastSeen: new Date(timestamps[timestamps.length - 1]).toISOString()
    };
  }
  return forecast;
}

/**
 * Return only ports predicted to appear in the next window
 */
function predictedPorts(forecast) {
  return Object.values(forecast).filter(f => f.predicted);
}

/**
 * Format forecast report as human-readable string
 */
function formatForecastReport(forecast) {
  const entries = Object.values(forecast).sort((a, b) => b.rate - a.rate);
  if (entries.length === 0) return 'No forecast data available.';
  const lines = ['Port Forecast Report', '===================='];
  for (const e of entries) {
    const flag = e.predicted ? '✓' : '–';
    lines.push(
      `${flag} Port ${e.port}  rate=${e.rate}/hr  confidence=${(e.confidence * 100).toFixed(0)}%  lastSeen=${e.lastSeen}`
    );
  }
  return lines.join('\n');
}

module.exports = { calcAppearanceRate, buildForecast, predictedPorts, formatForecastReport };
