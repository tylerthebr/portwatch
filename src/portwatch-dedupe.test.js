'use strict';

const {
  entryKey,
  findDuplicates,
  dedupeEntries,
  buildDedupeReport,
  formatDedupeReport
} = require('./portwatch-dedupe');

const e1 = { port: 3000, protocol: 'tcp', process: 'node' };
const e2 = { port: 3000, protocol: 'tcp', process: 'node' }; // dupe of e1
const e3 = { port: 8080, protocol: 'tcp', process: 'nginx' };
const e4 = { port: 3000, protocol: 'udp', process: 'node' }; // different proto
const e5 = { port: 8080, protocol: 'tcp', process: 'nginx' }; // dupe of e3

describe('entryKey', () => {
  test('builds key from port, protocol, process', () => {
    expect(entryKey(e1)).toBe('3000:tcp:node');
  });

  test('defaults protocol to tcp if missing', () => {
    expect(entryKey({ port: 9000, process: 'app' })).toBe('9000:tcp:app');
  });

  test('handles missing process', () => {
    expect(entryKey({ port: 5000, protocol: 'tcp' })).toBe('5000:tcp:');
  });
});

describe('findDuplicates', () => {
  test('returns empty array when no dupes', () => {
    expect(findDuplicates([e1, e3, e4])).toEqual([]);
  });

  test('returns duplicate entries', () => {
    const dupes = findDuplicates([e1, e2, e3, e5]);
    expect(dupes).toHaveLength(2);
    expect(dupes[0]).toBe(e2);
    expect(dupes[1]).toBe(e5);
  });
});

describe('dedupeEntries', () => {
  test('removes duplicate entries keeping first', () => {
    const result = dedupeEntries([e1, e2, e3, e5]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(e1);
    expect(result[1]).toBe(e3);
  });

  test('keeps entries with different protocols', () => {
    const result = dedupeEntries([e1, e4]);
    expect(result).toHaveLength(2);
  });

  test('returns same list when no dupes', () => {
    const result = dedupeEntries([e1, e3, e4]);
    expect(result).toHaveLength(3);
  });
});

describe('buildDedupeReport', () => {
  test('reports correct counts', () => {
    const original = [e1, e2, e3, e5];
    const deduped = dedupeEntries(original);
    const report = buildDedupeReport(original, deduped);
    expect(report.originalCount).toBe(4);
    expect(report.dedupedCount).toBe(2);
    expect(report.removedCount).toBe(2);
    expect(report.removed).toHaveLength(2);
  });

  test('reports zero removed when no dupes', () => {
    const original = [e1, e3];
    const deduped = dedupeEntries(original);
    const report = buildDedupeReport(original, deduped);
    expect(report.removedCount).toBe(0);
  });
});

describe('formatDedupeReport', () => {
  test('includes summary lines', () => {
    const original = [e1, e2, e3];
    const deduped = dedupeEntries(original);
    const report = buildDedupeReport(original, deduped);
    const text = formatDedupeReport(report);
    expect(text).toContain('Deduplication Report');
    expect(text).toContain('Original entries : 3');
    expect(text).toContain('Removed          : 1');
    expect(text).toContain('port=3000');
  });

  test('no duplicates section when clean', () => {
    const report = buildDedupeReport([e1], [e1]);
    const text = formatDedupeReport(report);
    expect(text).not.toContain('Duplicates:');
  });
});
