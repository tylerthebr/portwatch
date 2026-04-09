const {
  formatPortEntry,
  formatDiffEntry,
  formatTimestamp,
  formatDiffSummary,
} = require('./formatter');

const sampleEntry = { port: 3000, protocol: 'tcp', process: 'node', pid: 1234 };

describe('formatPortEntry', () => {
  it('formats a port entry without color', () => {
    const result = formatPortEntry(sampleEntry, false);
    expect(result).toContain('3000');
    expect(result).toContain('tcp');
    expect(result).toContain('node');
    expect(result).toContain('1234');
  });

  it('formats a port entry with color codes', () => {
    const result = formatPortEntry(sampleEntry, true);
    expect(result).toContain('\x1b[');
    expect(result).toContain('3000');
  });

  it('handles missing optional fields gracefully', () => {
    const result = formatPortEntry({ port: 8080 }, false);
    expect(result).toContain('8080');
    expect(result).toContain('unknown');
    expect(result).toContain('-');
  });
});

describe('formatDiffEntry', () => {
  it('prefixes added entries with +', () => {
    const result = formatDiffEntry(sampleEntry, 'added', false);
    expect(result.startsWith('+')).toBe(true);
  });

  it('prefixes removed entries with -', () => {
    const result = formatDiffEntry(sampleEntry, 'removed', false);
    expect(result.startsWith('-')).toBe(true);
  });

  it('applies green color for added entries', () => {
    const result = formatDiffEntry(sampleEntry, 'added', true);
    expect(result).toContain('\x1b[32m');
  });

  it('applies red color for removed entries', () => {
    const result = formatDiffEntry(sampleEntry, 'removed', true);
    expect(result).toContain('\x1b[31m');
  });
});

describe('formatTimestamp', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatTimestamp('2024-01-15T10:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles epoch ms', () => {
    const result = formatTimestamp(0);
    expect(typeof result).toBe('string');
  });
});

describe('formatDiffSummary', () => {
  it('returns no-changes message for empty diff', () => {
    const result = formatDiffSummary({ added: [], removed: [] }, false);
    expect(result).toContain('No changes detected');
  });

  it('includes added and removed entries', () => {
    const diff = { added: [sampleEntry], removed: [{ port: 4000, protocol: 'udp', process: 'app', pid: 99 }] };
    const result = formatDiffSummary(diff, false);
    expect(result).toContain('+');
    expect(result).toContain('-');
    expect(result).toContain('3000');
    expect(result).toContain('4000');
  });
});
