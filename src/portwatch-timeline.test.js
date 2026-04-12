const { buildTimeline, timelineForPort, formatTimeline } = require('./portwatch-timeline');

const mockHistory = [
  {
    timestamp: '2024-01-01T10:00:00.000Z',
    diff: {
      added: [{ port: 3000, process: 'node', proto: 'tcp' }],
      removed: []
    }
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    diff: {
      added: [{ port: 5432, process: 'postgres', proto: 'tcp' }],
      removed: [{ port: 3000, process: 'node', proto: 'tcp' }]
    }
  },
  {
    timestamp: '2024-01-01T12:00:00.000Z',
    diff: { added: [], removed: [] }
  }
];

describe('buildTimeline', () => {
  it('returns empty array for empty history', () => {
    expect(buildTimeline([])).toEqual([]);
    expect(buildTimeline(null)).toEqual([]);
  });

  it('filters out entries with no changes', () => {
    const result = buildTimeline(mockHistory);
    expect(result).toHaveLength(2);
  });

  it('maps added and removed correctly', () => {
    const result = buildTimeline(mockHistory);
    expect(result[0].added).toHaveLength(1);
    expect(result[0].added[0].port).toBe(3000);
    expect(result[1].removed[0].port).toBe(3000);
  });

  it('sorts by timestamp ascending', () => {
    const shuffled = [mockHistory[1], mockHistory[0]];
    const result = buildTimeline(shuffled);
    expect(new Date(result[0].timestamp) <= new Date(result[1].timestamp)).toBe(true);
  });
});

describe('timelineForPort', () => {
  it('returns only events involving the given port', () => {
    const timeline = buildTimeline(mockHistory);
    const result = timelineForPort(timeline, 3000);
    expect(result).toHaveLength(2);
  });

  it('returns empty array if port not in timeline', () => {
    const timeline = buildTimeline(mockHistory);
    expect(timelineForPort(timeline, 9999)).toHaveLength(0);
  });
});

describe('formatTimeline', () => {
  it('returns fallback message for empty timeline', () => {
    expect(formatTimeline([])).toBe('No timeline events found.');
  });

  it('includes + for added and - for removed', () => {
    const timeline = buildTimeline(mockHistory);
    const output = formatTimeline(timeline);
    expect(output).toContain('+ 3000/tcp');
    expect(output).toContain('- 3000/tcp');
  });

  it('includes timestamps', () => {
    const timeline = buildTimeline(mockHistory);
    const output = formatTimeline(timeline);
    expect(output).toMatch(/\[.*\]/);
  });
});
