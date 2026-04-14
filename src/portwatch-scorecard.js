// portwatch-scorecard.js
// Generates a health scorecard for the current port environment

const { buildMetricsReport } = require('./portmetrics');
const { getStaleEntries } = require('./portwatch-stale');
const { loadLocks } = require('./portlock');
const { loadThresholds, checkThresholds } = require('./portwatch-threshold');

const SCORE_MAX = 100;

function calcStalePenalty(staleEntries, total) {
  if (!total) return 0;
  const ratio = staleEntries.length / total;
  return Math.round(ratio * 30);
}

function calcThresholdPenalty(violations) {
  return Math.min(violations.length * 10, 40);
}

function calcLockBonus(locks, entries) {
  if (!entries.length) return 0;
  const lockedPorts = new Set(locks.map(l => l.port));
  const coveredCount = entries.filter(e => lockedPorts.has(e.port)).length;
  return Math.round((coveredCount / entries.length) * 10);
}

function buildScorecard(history, options = {}) {
  const { thresholdPath, lockPath } = options;
  const entries = history.flatMap(h => h.ports || []);
  const uniquePorts = [...new Map(entries.map(e => [e.port, e])).values()];

  const metrics = buildMetricsReport(history);
  const stale = getStaleEntries(history, options.staleThresholdMs || 3600000);
  const locks = loadLocks(lockPath);
  const thresholds = loadThresholds(thresholdPath);
  const violations = checkThresholds(uniquePorts, thresholds);

  const stalePenalty = calcStalePenalty(stale, uniquePorts.length);
  const thresholdPenalty = calcThresholdPenalty(violations);
  const lockBonus = calcLockBonus(locks, uniquePorts);

  const score = Math.max(0, Math.min(SCORE_MAX, SCORE_MAX - stalePenalty - thresholdPenalty + lockBonus));

  return {
    score,
    grade: scoreToGrade(score),
    totalPorts: uniquePorts.length,
    stalePorts: stale.length,
    violations: violations.length,
    lockedPorts: locks.length,
    metrics,
    breakdown: { stalePenalty, thresholdPenalty, lockBonus }
  };
}

function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

function formatScorecard(scorecard) {
  const { score, grade, totalPorts, stalePorts, violations, lockedPorts, breakdown } = scorecard;
  const lines = [
    `Portwatch Health Scorecard`,
    `──────────────────────────`,
    `Score : ${score} / 100  [${grade}]`,
    ``,
    `Total ports   : ${totalPorts}`,
    `Stale ports   : ${stalePorts}  (-${breakdown.stalePenalty} pts)`,
    `Violations    : ${violations}  (-${breakdown.thresholdPenalty} pts)`,
    `Locked ports  : ${lockedPorts}  (+${breakdown.lockBonus} pts)`,
  ];
  return lines.join('\n');
}

module.exports = { buildScorecard, scoreToGrade, formatScorecard, calcStalePenalty, calcThresholdPenalty, calcLockBonus };
