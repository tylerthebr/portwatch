const { getBucketKey, buildHeatmap, getHotPorts, formatHeatmap } = require('./portwatch-heatmap');

const HOUR = 60 * 60 * 1000;

function makeEntry(timestamp, ports) {
  return { timestamp, ports };
}

describe('getBucketKey', () => {
  it('rounds timestamp down to bucket boundary', () => {
    const ts = new Date('2024-01-01T02:45:00Z').getTime();
    const key = getBucketKey(ts, HOUR);
    expect(key).toBe('2024-01-01T02:00:00.000Z');
  });

  it('accepts ISO string timestamps', () => {
    const key = getBucketKey('2024-01-01T03:30:00Z', HOUR);
    expect(key).toBe('2024-01-01T03:00:00.000Z');
  });
});

describe('buildHeatmap', () => {
  it('counts ports per time bucket', () => {
    const entries = [
      makeEntry('2024-01-01T01:10:00Z', [{ port: 3000, protocol: 'tcp' }]),
      makeEntry('2024-01-01T01:20:00Z', [{ port: 3000, protocol: 'tcp' }, { port: 8080, protocol: 'tcp' }]),
      makeEntry('2024-01-01T02:05:00Z', [{ port: 5432, protocol: 'tcp' }]),
    ];
    const heatmap = buildHeatmap(entries, HOUR);
    const bucket1 = heatmap['2024-01-01T01:00:00.000Z'];
    expect(bucket1['3000/tcp']).toBe(2);
    expect(bucket1['8080/tcp']).toBe(1);
    const bucket2 = heatmap['2024-01-01T02:00:00.000Z'];
    expect(bucket2['5432/tcp']).toBe(1);
  });

  it('returns empty map for no entries', () => {
    expect(buildHeatmap([])).toEqual({});
  });

  it('handles entries with no ports array', () => {
    const entries = [makeEntry('2024-01-01T01:00:00Z', null)];
    const heatmap = buildHeatmap(entries, HOUR);
    expect(Object.keys(heatmap['2024-01-01T01:00:00.000Z']).length).toBe(0);
  });
});

describe('getHotPorts', () => {
  it('returns top N ports by total count', () => {
    const heatmap = {
      'bucket1': { '3000/tcp': 5, '8080/tcp': 2 },
      'bucket2': { '3000/tcp': 3, '5432/tcp': 10 },
    };
    const hot = getHotPorts(heatmap, 2);
    expect(hot[0].key).toBe('5432/tcp');
    expect(hot[1].key).toBe('3000/tcp');
    expect(hot.length).toBe(2);
  });
});

describe('formatHeatmap', () => {
  it('renders sorted bucket lines', () => {
    const heatmap = {
      '2024-01-01T02:00:00.000Z': { '3000/tcp': 2 },
      '2024-01-01T01:00:00.000Z': { '8080/tcp': 1 },
    };
    const out = formatHeatmap(heatmap);
    const lines = out.split('\n');
    expect(lines[0]).toContain('01:00');
    expect(lines[1]).toContain('02:00');
  });

  it('returns (no data) for empty heatmap', () => {
    expect(formatHeatmap({})).toContain('(no data)');
  });
});
