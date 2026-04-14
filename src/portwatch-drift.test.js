const { detectDrift, scoreDrift, formatDriftReport, DRIFT_SEVERITY } = require('./portwatch-drift');

const makePort = (port, protocol = 'tcp', process = 'node') => ({ port, protocol, process });

describe('scoreDrift', () => {
  it('returns zero score', () => {
    const { score, severity } = scoreDrift([], []);
    expect(score).toBe(0);
    expect(severity).toBeNull();
  });

  it('returns low severity for 1-2 changes', () => {
    const { score, severity } = scoreDrift([makePort(3000)], []);
    expect(score).toBe(1);
    expect(severity).toBe(DRIFT_SEVERITY.low);
  });

  it('returns medium severity for 3-6 changes', () => {
    const added = [makePort(3000), makePort(3001), makePort(3002)];
    const { severity } = scoreDrift(added, []);
    expect(severity).toBe(DRIFT_SEVERITY.medium);
  });

  it('returns high severity for 7+ changes', () => {
    const added = Array.from({ length: 7 }, (_, i) => makePort(3000 + i));
    const { severity } = scoreDrift(added, []);
    expect(severity).toBe(DRIFT_SEVERITY.high);
  });
});

describe('detectDrift', () => {
  it('returns no drift when baseline is null', () => {
    const result = detectDrift([makePort(3000)], null);
    expect(result.hasDrift).toBe(false);
    expect(result.message).toMatch(/no baseline/i);
  });

  it('returns no drift when ports match baseline', () => {
    const ports = [makePort(3000), makePort(4000)];
    const baseline = { ports, savedAt: Date.now() };
    const result = detectDrift(ports, baseline);
    expect(result.hasDrift).toBe(false);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it('detects added ports', () => {
    const baseline = { ports: [makePort(3000)], savedAt: Date.now() };
    const current = [makePort(3000), makePort(4000)];
    const result = detectDrift(current, baseline);
    expect(result.hasDrift).toBe(true);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].port).toBe(4000);
  });

  it('detects removed ports', () => {
    const baseline = { ports: [makePort(3000), makePort(4000)], savedAt: Date.now() };
    const current = [makePort(3000)];
    const result = detectDrift(current, baseline);
    expect(result.hasDrift).toBe(true);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].port).toBe(4000);
  });

  it('includes severity in result', () => {
    const baseline = { ports: [], savedAt: Date.now() };
    const current = [makePort(3000)];
    const result = detectDrift(current, baseline);
    expect(result.severity).toBe(DRIFT_SEVERITY.low);
  });
});

describe('formatDriftReport', () => {
  it('includes drift message in output', () => {
    const report = {
      hasDrift: true,
      added: [makePort(3000)],
      removed: [],
      score: 1,
      severity: DRIFT_SEVERITY.low,
      baselineAt: Date.now(),
      message: 'Drift detected: +1 added, -0 removed',
    };
    const output = formatDriftReport(report);
    expect(output).toContain('Drift detected');
    expect(output).toContain('3000');
    expect(output).toContain('LOW');
  });

  it('shows no drift message when clean', () => {
    const report = {
      hasDrift: false,
      added: [],
      removed: [],
      score: 0,
      severity: null,
      baselineAt: null,
      message: 'No drift detected',
    };
    const output = formatDriftReport(report);
    expect(output).toContain('No drift detected');
  });
});
