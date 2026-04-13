const { annotateEntry, annotateEntries, formatAnnotation, hasAnnotation } = require('./portwatch-annotate');

jest.mock('./tags', () => ({ getTag: (p) => (p === 3000 ? 'frontend' : null) }));
jest.mock('./portaliases', () => ({ getAlias: (p) => (p === 3000 ? 'react-dev' : null) }));
jest.mock('./portmemo', () => ({ getMemo: (p) => (p === 8080 ? 'proxy server' : null) }));
jest.mock('./portlabel', () => ({ getLabelForPort: (p) => (p === 443 ? 'HTTPS' : null) }));

const makeEntry = (port) => ({ port, pid: 100, process: 'node', protocol: 'tcp' });

describe('annotateEntry', () => {
  it('attaches tag and alias for port 3000', () => {
    const result = annotateEntry(makeEntry(3000));
    expect(result.annotation.tag).toBe('frontend');
    expect(result.annotation.alias).toBe('react-dev');
    expect(result.annotation.memo).toBeNull();
    expect(result.annotation.label).toBeNull();
  });

  it('attaches memo for port 8080', () => {
    const result = annotateEntry(makeEntry(8080));
    expect(result.annotation.memo).toBe('proxy server');
  });

  it('attaches well-known label for port 443', () => {
    const result = annotateEntry(makeEntry(443));
    expect(result.annotation.label).toBe('HTTPS');
  });

  it('preserves original entry fields', () => {
    const result = annotateEntry(makeEntry(9000));
    expect(result.port).toBe(9000);
    expect(result.pid).toBe(100);
  });
});

describe('annotateEntries', () => {
  it('annotates all entries', () => {
    const results = annotateEntries([makeEntry(3000), makeEntry(443)]);
    expect(results).toHaveLength(2);
    expect(results[0].annotation.tag).toBe('frontend');
    expect(results[1].annotation.label).toBe('HTTPS');
  });
});

describe('formatAnnotation', () => {
  it('formats all fields when present', () => {
    const ann = { label: 'HTTP', alias: 'web', tag: 'public', memo: 'main site' };
    const out = formatAnnotation(ann);
    expect(out).toContain('[HTTP]');
    expect(out).toContain('[alias: web]');
    expect(out).toContain('[tag: public]');
    expect(out).toContain('[memo: main site]');
  });

  it('returns empty string when no fields', () => {
    expect(formatAnnotation({ label: null, alias: null, tag: null, memo: null })).toBe('');
  });
});

describe('hasAnnotation', () => {
  it('returns true when any field is set', () => {
    const entry = annotateEntry(makeEntry(3000));
    expect(hasAnnotation(entry)).toBe(true);
  });

  it('returns false when all fields are null', () => {
    const entry = { port: 9999, annotation: { tag: null, alias: null, memo: null, label: null } };
    expect(hasAnnotation(entry)).toBe(false);
  });

  it('returns false when no annotation key', () => {
    expect(hasAnnotation({ port: 1234 })).toBe(false);
  });
});
