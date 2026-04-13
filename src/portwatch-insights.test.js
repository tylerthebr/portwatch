const { buildInsights, formatInsights, INSIGHT_TYPES } = require('./portwatch-insights');

const now = Date.now();
const hour = 60 * 60 * 1000;

function makeHistory(portSets) {
  return portSets.map(([ts, ports]) => ({
    timestamp: new Date(ts).toISOString(),
    ports: ports.map(p => ({ port: p, process: `proc_${p}`, protocol: 'tcp' })),
  }));
}

describe('buildInsights', () => {
  test('returns empty array for empty history', () => {
    expect(buildInsights([])).toEqual([]);
    expect(buildInsights(null)).toEqual([]);
  });

  test('marks port as always_on when present in all snapshots', () => {
    const history = makeHistory([
      [now - 3 * hour, [3000, 8080]],
      [now - 2 * hour, [3000, 8080]],
      [now - 1 * hour, [3000, 8080]],
    ]);
    const insights = buildInsights(history);
    const alwaysOn = insights.filter(i => i.type === INSIGHT_TYPES.ALWAYS_ON);
    expect(alwaysOn.length).toBeGreaterThan(0);
    expect(alwaysOn.map(i => i.port)).toContain(3000);
  });

  test('marks port as rarely_seen when below threshold', () => {
    const history = makeHistory([
      [now - 10 * hour, [3000]],
      [now - 9 * hour, [3000]],
      [now - 8 * hour, [3000]],
      [now - 7 * hour, [3000]],
      [now - 6 * hour, [3000]],
      [now - 5 * hour, [3000]],
      [now - 4 * hour, [3000]],
      [now - 3 * hour, [3000]],
      [now - 2 * hour, [3000]],
      [now - 1 * hour, [3000, 9999]],
    ]);
    const insights = buildInsights(history, { rareThreshold: 0.15 });
    const rare = insights.filter(i => i.type === INSIGHT_TYPES.RARELY_SEEN);
    expect(rare.map(i => i.port)).toContain(9999);
  });

  test('marks port as recently_new when only in last 24h', () => {
    const history = makeHistory([
      [now - 48 * hour, [3000]],
      [now - 36 * hour, [3000]],
      [now - 2 * hour, [3000, 4321]],
    ]);
    const insights = buildInsights(history);
    const newPorts = insights.filter(i => i.type === INSIGHT_TYPES.RECENTLY_NEW);
    expect(newPorts.map(i => i.port)).toContain(4321);
  });

  test('respects topN option (loose cap)', () => {
    const ports = Array.from({ length: 20 }, (_, i) => 3000 + i);
    const history = makeHistory([[now - hour, ports]]);
    const insights = buildInsights(history, { topN: 3 });
    expect(insights.length).toBeLessThanOrEqual(12);
  });
});

describe('formatInsights', () => {
  test('returns no-insights message for empty array', () => {
    expect(formatInsights([])).toMatch(/no insights/i);
  });

  test('formats always_on insight', () => {
    const insights = [{ type: INSIGHT_TYPES.ALWAYS_ON, port: 3000, label: 'node', ratio: 1.0 }];
    const out = formatInsights(insights);
    expect(out).toMatch(/always-on/);
    expect(out).toMatch(/3000/);
  });

  test('formats recently_new insight', () => {
    const insights = [{ type: INSIGHT_TYPES.RECENTLY_NEW, port: 4321, label: 'proc_4321', ratio: 0.1 }];
    const out = formatInsights(insights);
    expect(out).toMatch(/new \(24h\)/);
    expect(out).toMatch(/4321/);
  });
});
