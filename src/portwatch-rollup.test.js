const { buildRollup, formatRollup } = require('./portwatch-rollup');

const now = Date.now();

function makeEntry(offsetMs, ports) {
  return {
    timestamp: new Date(now - offsetMs).toISOString(),
    ports: ports.map(p => (typeof p === 'object' ? p : { port: p, process: 'node' }))
  };
}

describe('buildRollup', () => {
  test('includes entries within window', () => {
    const history = [
      makeEntry(1000, [3000, 4000]),
      makeEntry(2000, [3000]),
      makeEntry(25 * 3600 * 1000, [9999]) // outside 24h window
    ];
    const rollup = buildRollup(history, 24 * 3600 * 1000);
    expect(rollup.totalSnapshots).toBe(2);
    expect(rollup.uniquePortCount).toBe(2);
    const ports = rollup.ports.map(p => p.port);
    expect(ports).not.toContain(9999);
  });

  test('counts appearances correctly', () => {
    const history = [
      makeEntry(1000, [3000, 4000]),
      makeEntry(2000, [3000])
    ];
    const rollup = buildRollup(history);
    const p3000 = rollup.ports.find(p => p.port === 3000);
    expect(p3000.appearances).toBe(2);
    const p4000 = rollup.ports.find(p => p.port === 4000);
    expect(p4000.appearances).toBe(1);
  });

  test('sorts by appearances descending', () => {
    const history = [
      makeEntry(1000, [3000, 4000]),
      makeEntry(2000, [3000]),
      makeEntry(3000, [3000])
    ];
    const rollup = buildRollup(history);
    expect(rollup.ports[0].port).toBe(3000);
  });

  test('collects process names', () => {
    const history = [
      makeEntry(1000, [{ port: 8080, process: 'nginx' }]),
      makeEntry(2000, [{ port: 8080, process: 'nginx' }])
    ];
    const rollup = buildRollup(history);
    expect(rollup.ports[0].processes).toContain('nginx');
  });

  test('returns empty ports for empty history', () => {
    const rollup = buildRollup([]);
    expect(rollup.ports).toHaveLength(0);
    expect(rollup.totalSnapshots).toBe(0);
  });
});

describe('formatRollup', () => {
  test('includes header with snapshot count', () => {
    const history = [makeEntry(1000, [3000])];
    const rollup = buildRollup(history);
    const output = formatRollup(rollup);
    expect(output).toMatch(/Port Rollup/);
    expect(output).toMatch(/1 snapshot/);
  });

  test('includes port lines', () => {
    const history = [makeEntry(1000, [8080])];
    const rollup = buildRollup(history);
    const output = formatRollup(rollup);
    expect(output).toMatch(/:8080/);
    expect(output).toMatch(/100%/);
  });
});
