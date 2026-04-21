const {
  buildLifecycleMap,
  calcUptimeDuration,
  getLifecycleForPort,
  buildLifecycleReport,
  formatLifecycleEntry
} = require('./portwatch-lifecycle');

function makeHistory(...snapshots) {
  return snapshots.map(([timestamp, ports]) => ({ timestamp, ports }));
}

const t1 = '2024-01-01T10:00:00.000Z';
const t2 = '2024-01-01T10:05:00.000Z';
const t3 = '2024-01-01T10:10:00.000Z';

const portA = { port: 3000, protocol: 'tcp', process: 'node' };
const portB = { port: 5432, protocol: 'tcp', process: 'postgres' };

describe('buildLifecycleMap', () => {
  it('tracks firstSeen and lastSeen', () => {
    const history = makeHistory([t1, [portA]], [t3, [portA]]);
    const map = buildLifecycleMap(history);
    expect(map['3000/tcp'].firstSeen).toBe(t1);
    expect(map['3000/tcp'].lastSeen).toBe(t3);
  });

  it('counts appearances', () => {
    const history = makeHistory([t1, [portA]], [t2, [portA]], [t3, [portA]]);
    const map = buildLifecycleMap(history);
    expect(map['3000/tcp'].appearances).toBe(3);
  });

  it('handles multiple ports', () => {
    const history = makeHistory([t1, [portA, portB]]);
    const map = buildLifecycleMap(history);
    expect(map['3000/tcp']).toBeDefined();
    expect(map['5432/tcp']).toBeDefined();
  });

  it('records gaps between appearances', () => {
    const history = makeHistory([t1, [portA]], [t2, [portA]]);
    const map = buildLifecycleMap(history);
    expect(map['3000/tcp'].gaps.length).toBe(1);
    expect(map['3000/tcp'].gaps[0]).toBe(5 * 60 * 1000);
  });
});

describe('calcUptimeDuration', () => {
  it('returns ms between firstSeen and lastSeen', () => {
    const entry = { firstSeen: t1, lastSeen: t3 };
    expect(calcUptimeDuration(entry)).toBe(10 * 60 * 1000);
  });

  it('returns 0 for same timestamps', () => {
    const entry = { firstSeen: t1, lastSeen: t1 };
    expect(calcUptimeDuration(entry)).toBe(0);
  });
});

describe('getLifecycleForPort', () => {
  it('returns lifecycle for a specific port', () => {
    const history = makeHistory([t1, [portA]]);
    const result = getLifecycleForPort(3000, 'tcp', history);
    expect(result).not.toBeNull();
    expect(result.port).toBe(3000);
  });

  it('returns null for unknown port', () => {
    const result = getLifecycleForPort(9999, 'tcp', []);
    expect(result).toBeNull();
  });
});

describe('buildLifecycleReport', () => {
  it('includes uptimeMs and avgGapMs', () => {
    const history = makeHistory([t1, [portA]], [t2, [portA]]);
    const report = buildLifecycleReport(history);
    expect(report[0].uptimeMs).toBe(5 * 60 * 1000);
    expect(report[0].avgGapMs).toBe(5 * 60 * 1000);
  });
});

describe('formatLifecycleEntry', () => {
  it('formats entry as a readable string', () => {
    const entry = {
      port: 3000, protocol: 'tcp', process: 'node',
      firstSeen: t1, lastSeen: t2,
      appearances: 2, uptimeMs: 300000, avgGapMs: 300000
    };
    const out = formatLifecycleEntry(entry);
    expect(out).toContain('3000/tcp');
    expect(out).toContain('node');
    expect(out).toContain('appearances=2');
  });
});
