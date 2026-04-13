// integration test: annotateEntries works end-to-end with real-ish data

const { annotateEntries, formatAnnotation, hasAnnotation } = require('./portwatch-annotate');

jest.mock('./tags', () => ({
  getTag: (p) => ({ 3000: 'frontend', 8080: 'proxy' }[p] || null),
}));
jest.mock('./portaliases', () => ({
  getAlias: (p) => ({ 3000: 'react-dev', 5432: 'postgres' }[p] || null),
}));
jest.mock('./portmemo', () => ({
  getMemo: (p) => ({ 8080: 'nginx proxy', 9000: 'debug server' }[p] || null),
}));
jest.mock('./portlabel', () => ({
  getLabelForPort: (p) => ({ 443: 'HTTPS', 80: 'HTTP', 22: 'SSH' }[p] || null),
}));

const ports = [
  { port: 3000, pid: 1001, process: 'node', protocol: 'tcp' },
  { port: 8080, pid: 1002, process: 'nginx', protocol: 'tcp' },
  { port: 5432, pid: 1003, process: 'postgres', protocol: 'tcp' },
  { port: 443,  pid: 1004, process: 'nginx', protocol: 'tcp' },
  { port: 9999, pid: 1005, process: 'unknown', protocol: 'udp' },
];

describe('annotateEntries integration', () => {
  let results;

  beforeAll(() => {
    results = annotateEntries(ports);
  });

  it('produces the correct number of results', () => {
    expect(results).toHaveLength(5);
  });

  it('port 3000 has tag and alias', () => {
    const e = results.find(r => r.port === 3000);
    expect(e.annotation.tag).toBe('frontend');
    expect(e.annotation.alias).toBe('react-dev');
  });

  it('port 8080 has tag and memo', () => {
    const e = results.find(r => r.port === 8080);
    expect(e.annotation.tag).toBe('proxy');
    expect(e.annotation.memo).toBe('nginx proxy');
  });

  it('port 443 has well-known label', () => {
    const e = results.find(r => r.port === 443);
    expect(e.annotation.label).toBe('HTTPS');
  });

  it('port 9999 has no annotations', () => {
    const e = results.find(r => r.port === 9999);
    expect(hasAnnotation(e)).toBe(false);
  });

  it('formatAnnotation produces readable output for port 3000', () => {
    const e = results.find(r => r.port === 3000);
    const out = formatAnnotation(e.annotation);
    expect(out).toContain('[alias: react-dev]');
    expect(out).toContain('[tag: frontend]');
  });

  it('annotated count is correct', () => {
    const withAnn = results.filter(hasAnnotation);
    expect(withAnn.length).toBe(4); // 9999 has none
  });
});
