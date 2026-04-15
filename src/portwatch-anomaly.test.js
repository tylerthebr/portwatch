const { scoreAnomaly, detectAnomalies, buildAnomalyReport, formatAnomalyReport } = require('./portwatch-anomaly');

const makeEntry = (port, process = 'node') => ({ port, process, protocol: 'tcp' });

const makeHistory = (portLists) =>
  portLists.map((ports, i) => ({
    timestamp: `2024-01-0${i + 1}T00:00:00.000Z`,
    entries: ports.map(p => makeEntry(p))
  }));

describe('scoreAnomaly', () => {
  it('returns 0 when port seen every snapshot', () => {
    const freq = { '3000': 5 };
    expect(scoreAnomaly('3000', freq, 5)).toBe(0);
  });

  it('returns 1 when port never seen', () => {
    expect(scoreAnomaly('9999', {}, 5)).toBe(1);
  });

  it('returns 0 when totalSnapshots is 0', () => {
    expect(scoreAnomaly('3000', {}, 0)).toBe(0);
  });

  it('returns partial score for partially seen port', () => {
    const score = scoreAnomaly('4000', { '4000': 2 }, 4);
    expect(score).toBe(0.5);
  });
});

describe('detectAnomalies', () => {
  it('flags ports never seen in history', () => {
    const history = makeHistory([[3000], [3000]]);
    const current = [makeEntry(3000), makeEntry(9999)];
    const result = detectAnomalies(current, history, 0.8);
    expect(result).toHaveLength(1);
    expect(result[0].port).toBe(9999);
    expect(result[0].anomalyScore).toBe(1);
  });

  it('returns empty array when all ports are familiar', () => {
    const history = makeHistory([[3000, 4000], [3000, 4000]]);
    const current = [makeEntry(3000), makeEntry(4000)];
    const result = detectAnomalies(current, history, 0.8);
    expect(result).toHaveLength(0);
  });

  it('respects threshold parameter', () => {
    const history = makeHistory([[3000], [3000], [3000], [3000]]);
    const current = [makeEntry(3000), makeEntry(4000)];
    const low = detectAnomalies(current, history, 0.1);
    const high = detectAnomalies(current, history, 0.99);
    expect(low.length).toBeGreaterThan(0);
    expect(high.length).toBe(1);
  });
});

describe('buildAnomalyReport', () => {
  it('returns structured report', () => {
    const history = makeHistory([[3000]]);
    const current = [makeEntry(9999)];
    const report = buildAnomalyReport(current, history);
    expect(report).toHaveProperty('anomalyCount', 1);
    expect(report).toHaveProperty('threshold', 0.8);
    expect(report.anomalies[0].port).toBe(9999);
  });
});

describe('formatAnomalyReport', () => {
  it('prints no-anomaly message when clean', () => {
    const report = { anomalyCount: 0, threshold: 0.8, anomalies: [] };
    expect(formatAnomalyReport(report)).toMatch(/No anomalies/);
  });

  it('lists anomalous ports', () => {
    const report = {
      anomalyCount: 1,
      threshold: 0.8,
      anomalies: [{ port: 9999, process: 'unknown', anomalyScore: 1 }]
    };
    const out = formatAnomalyReport(report);
    expect(out).toMatch(/9999/);
    expect(out).toMatch(/score=1/);
  });
});
