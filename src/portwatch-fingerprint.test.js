const {
  normalizeEntry,
  buildFingerprint,
  compareFingerprints,
  annotateSnapshotWithFingerprint
} = require('./portwatch-fingerprint');

const entry1 = { port: 3000, protocol: 'tcp', process: 'node', state: 'LISTEN' };
const entry2 = { port: 5432, protocol: 'tcp', process: 'postgres', state: 'LISTEN' };
const entry3 = { port: 8080, protocol: 'udp', process: 'nginx', state: 'LISTEN' };

describe('normalizeEntry', () => {
  it('returns a pipe-delimited string', () => {
    expect(normalizeEntry(entry1)).toBe('3000|tcp|node|listen');
  });

  it('lowercases protocol and process', () => {
    const e = { port: 80, protocol: 'TCP', process: 'NGINX', state: 'LISTEN' };
    expect(normalizeEntry(e)).toBe('80|tcp|nginx|listen');
  });

  it('handles missing fields gracefully', () => {
    const result = normalizeEntry({});
    expect(result).toBe('|tcp||');
  });
});

describe('buildFingerprint', () => {
  it('returns a hex string', () => {
    const fp = buildFingerprint([entry1]);
    expect(fp).toMatch(/^[a-f0-9]{40}$/);
  });

  it('returns same fingerprint regardless of entry order', () => {
    const fp1 = buildFingerprint([entry1, entry2]);
    const fp2 = buildFingerprint([entry2, entry1]);
    expect(fp1).toBe(fp2);
  });

  it('returns different fingerprints for different entries', () => {
    const fp1 = buildFingerprint([entry1]);
    const fp2 = buildFingerprint([entry2]);
    expect(fp1).not.toBe(fp2);
  });

  it('handles empty array', () => {
    const fp = buildFingerprint([]);
    expect(fp).toMatch(/^[a-f0-9]{40}$/);
  });

  it('handles null/undefined gracefully', () => {
    const fp = buildFingerprint(null);
    expect(fp).toMatch(/^[a-f0-9]{40}$/);
  });
});

describe('compareFingerprints', () => {
  it('detects no change when snapshots are identical', () => {
    const result = compareFingerprints([entry1, entry2], [entry2, entry1]);
    expect(result.changed).toBe(false);
    expect(result.fingerprintA).toBe(result.fingerprintB);
  });

  it('detects change when snapshots differ', () => {
    const result = compareFingerprints([entry1], [entry2]);
    expect(result.changed).toBe(true);
    expect(result.fingerprintA).not.toBe(result.fingerprintB);
  });

  it('returns both fingerprints', () => {
    const result = compareFingerprints([entry1], [entry1, entry3]);
    expect(result).toHaveProperty('fingerprintA');
    expect(result).toHaveProperty('fingerprintB');
  });
});

describe('annotateSnapshotWithFingerprint', () => {
  it('adds fingerprint to snapshot object', () => {
    const snapshot = { timestamp: Date.now(), entries: [entry1, entry2] };
    const annotated = annotateSnapshotWithFingerprint(snapshot);
    expect(annotated).toHaveProperty('fingerprint');
    expect(annotated.fingerprint).toMatch(/^[a-f0-9]{40}$/);
  });

  it('preserves existing snapshot fields', () => {
    const snapshot = { timestamp: 12345, entries: [entry1] };
    const annotated = annotateSnapshotWithFingerprint(snapshot);
    expect(annotated.timestamp).toBe(12345);
    expect(annotated.entries).toEqual([entry1]);
  });

  it('handles snapshot with no entries', () => {
    const annotated = annotateSnapshotWithFingerprint({ entries: [] });
    expect(annotated.fingerprint).toMatch(/^[a-f0-9]{40}$/);
  });
});
