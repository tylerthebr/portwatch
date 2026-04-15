const {
  clusterByProximity,
  clusterByProcess,
  buildClusterReport,
  formatCluster
} = require('./portwatch-cluster');

function makeEntry(port, process = 'node') {
  return { port, process, protocol: 'tcp' };
}

describe('clusterByProximity', () => {
  it('returns empty array for no entries', () => {
    expect(clusterByProximity([])).toEqual([]);
  });

  it('clusters consecutive ports within default gap', () => {
    const entries = [makeEntry(3000), makeEntry(3001), makeEntry(3002)];
    const result = clusterByProximity(entries);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(3000);
    expect(result[0].end).toBe(3002);
    expect(result[0].entries).toHaveLength(3);
  });

  it('splits into multiple clusters when gap is exceeded', () => {
    const entries = [makeEntry(3000), makeEntry(3001), makeEntry(5000), makeEntry(5001)];
    const result = clusterByProximity(entries, 10);
    expect(result).toHaveLength(2);
    expect(result[0].start).toBe(3000);
    expect(result[1].start).toBe(5000);
  });

  it('respects custom gap parameter', () => {
    const entries = [makeEntry(100), makeEntry(105), makeEntry(200)];
    const tight = clusterByProximity(entries, 3);
    expect(tight).toHaveLength(2);
    const loose = clusterByProximity(entries, 200);
    expect(loose).toHaveLength(1);
  });
});

describe('clusterByProcess', () => {
  it('groups entries by process name', () => {
    const entries = [makeEntry(3000, 'node'), makeEntry(5432, 'postgres'), makeEntry(3001, 'node')];
    const result = clusterByProcess(entries);
    expect(result['node']).toHaveLength(2);
    expect(result['postgres']).toHaveLength(1);
  });

  it('uses unknown for missing process', () => {
    const entries = [{ port: 8080, protocol: 'tcp' }];
    const result = clusterByProcess(entries);
    expect(result['unknown']).toHaveLength(1);
  });
});

describe('buildClusterReport', () => {
  it('returns proximity and byProcess fields', () => {
    const entries = [makeEntry(3000), makeEntry(3001)];
    const report = buildClusterReport(entries);
    expect(report).toHaveProperty('proximity');
    expect(report).toHaveProperty('byProcess');
    expect(report.total).toBe(2);
    expect(report.generatedAt).toBeDefined();
  });
});

describe('formatCluster', () => {
  it('formats a cluster into a readable string', () => {
    const cluster = { start: 3000, end: 3002, entries: [makeEntry(3000), makeEntry(3001), makeEntry(3002)] };
    const out = formatCluster(cluster);
    expect(out).toContain('3000-3002');
    expect(out).toContain('3 ports');
  });
});
