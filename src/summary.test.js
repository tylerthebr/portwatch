const { buildSummary, buildDiffSummary, getTopProcesses, formatSummary } = require('./summary');

const sampleSnapshot = {
  '3000': { port: 3000, protocol: 'tcp', process: 'node' },
  '5432': { port: 5432, protocol: 'tcp', process: 'postgres' },
  '8080': { port: 8080, protocol: 'tcp', process: 'node' },
  '53':   { port: 53,   protocol: 'udp', process: 'systemd-resolved' },
};

describe('buildSummary', () => {
  it('counts total ports correctly', () => {
    const s = buildSummary(sampleSnapshot);
    expect(s.totalPorts).toBe(4);
  });

  it('splits by protocol', () => {
    const s = buildSummary(sampleSnapshot);
    expect(s.protocols.tcp).toBe(3);
    expect(s.protocols.udp).toBe(1);
  });

  it('identifies top processes', () => {
    const s = buildSummary(sampleSnapshot);
    expect(s.topProcesses[0].name).toBe('node');
    expect(s.topProcesses[0].count).toBe(2);
  });

  it('includes generatedAt timestamp', () => {
    const s = buildSummary(sampleSnapshot);
    expect(typeof s.generatedAt).toBe('string');
    expect(s.generatedAt.length).toBeGreaterThan(0);
  });
});

describe('buildDiffSummary', () => {
  const diff = [
    { type: 'opened', port: 3000 },
    { type: 'opened', port: 4000 },
    { type: 'closed', port: 8080 },
    { type: 'changed', port: 5432 },
  ];

  it('counts opened/closed/changed', () => {
    const s = buildDiffSummary(diff);
    expect(s.opened).toBe(2);
    expect(s.closed).toBe(1);
    expect(s.changed).toBe(1);
    expect(s.total).toBe(4);
  });

  it('lists opened and closed ports', () => {
    const s = buildDiffSummary(diff);
    expect(s.openedPorts).toContain(3000);
    expect(s.closedPorts).toContain(8080);
  });
});

describe('getTopProcesses', () => {
  it('returns sorted top N entries', () => {
    const map = { node: 5, nginx: 2, postgres: 3 };
    const top = getTopProcesses(map, 2);
    expect(top[0].name).toBe('node');
    expect(top[1].name).toBe('postgres');
    expect(top.length).toBe(2);
  });
});

describe('formatSummary', () => {
  it('returns a non-empty string', () => {
    const s = buildSummary(sampleSnapshot);
    const out = formatSummary(s);
    expect(typeof out).toBe('string');
    expect(out).toMatch(/Total open ports/);
    expect(out).toMatch(/node/);
  });
});
