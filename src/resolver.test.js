const { enrichEntry, enrichEntries, buildLabel } = require('./resolver');

describe('enrichEntry', () => {
  it('returns entry unchanged if process is already set', () => {
    const entry = { port: 3000, pid: '123', process: 'node' };
    const result = enrichEntry(entry);
    expect(result.process).toBe('node');
  });

  it('sets process to unknown if pid is missing', () => {
    const entry = { port: 8080, pid: null, process: null };
    const result = enrichEntry(entry);
    expect(result.process).toBe('unknown');
  });

  it('sets process to unknown if process is a dash', () => {
    const entry = { port: 5432, pid: '-', process: '-' };
    const result = enrichEntry(entry);
    expect(result.process).toBe('unknown');
  });

  it('does not mutate the original entry', () => {
    const entry = { port: 3000, pid: null, process: null };
    enrichEntry(entry);
    expect(entry.process).toBeNull();
  });
});

describe('enrichEntries', () => {
  it('returns an empty array for non-array input', () => {
    expect(enrichEntries(null)).toEqual([]);
    expect(enrichEntries(undefined)).toEqual([]);
  });

  it('enriches all entries in an array', () => {
    const entries = [
      { port: 3000, pid: null, process: 'node' },
      { port: 8080, pid: null, process: null },
    ];
    const result = enrichEntries(entries);
    expect(result).toHaveLength(2);
    expect(result[0].process).toBe('node');
    expect(result[1].process).toBe('unknown');
  });
});

describe('buildLabel', () => {
  it('builds a label with protocol and port', () => {
    const entry = { port: 3000, protocol: 'tcp', process: 'node' };
    expect(buildLabel(entry)).toBe('TCP:3000 (node)');
  });

  it('defaults to TCP when protocol is missing', () => {
    const entry = { port: 8080, process: 'nginx' };
    expect(buildLabel(entry)).toBe('TCP:8080 (nginx)');
  });

  it('omits process name when unknown', () => {
    const entry = { port: 5432, protocol: 'tcp', process: 'unknown' };
    expect(buildLabel(entry)).toBe('TCP:5432');
  });

  it('omits process name when not present', () => {
    const entry = { port: 27017, protocol: 'udp' };
    expect(buildLabel(entry)).toBe('UDP:27017');
  });
});
