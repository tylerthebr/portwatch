const { buildReport, formatReport } = require('./portwatch-report');
const history = require('./history');
const baseline = require('./baseline');

jest.mock('./history');
jest.mock('./baseline');
jest.mock('./summary', () => ({
  buildDiffSummary: jest.fn(() => ({ opened: 2, closed: 1, changed: 0 }))
}));
jest.mock('./formatter', () => ({
  formatTimestamp: jest.fn(ts => `formatted(${ts})`)
}));

const mockHistory = [
  { timestamp: '2024-01-01T10:00:00Z', diff: [{ type: 'opened' }, { type: 'closed' }] },
  { timestamp: '2024-01-02T10:00:00Z', diff: [{ type: 'opened' }] },
  { timestamp: '2024-01-03T10:00:00Z', diff: [] }
];

beforeEach(() => {
  history.loadHistory.mockReturnValue(mockHistory);
  baseline.loadBaseline.mockReturnValue(null);
});

test('buildReport returns correct totals', () => {
  const report = buildReport();
  expect(report.totalSnapshots).toBe(3);
  expect(report.totalChanges).toBe(3);
  expect(report.hasBaseline).toBe(false);
});

test('buildReport respects limit', () => {
  const report = buildReport({ limit: 2 });
  expect(report.totalSnapshots).toBe(2);
  expect(report.entries).toHaveLength(2);
});

test('buildReport respects since filter', () => {
  const report = buildReport({ since: '2024-01-02T00:00:00Z' });
  expect(report.totalSnapshots).toBe(2);
});

test('buildReport includes hasBaseline true when baseline exists', () => {
  baseline.loadBaseline.mockReturnValue({ ports: [] });
  const report = buildReport();
  expect(report.hasBaseline).toBe(true);
});

test('formatReport returns a non-empty string', () => {
  const report = buildReport();
  const output = formatReport(report);
  expect(typeof output).toBe('string');
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('portwatch report');
});

test('formatReport includes opened/closed counts', () => {
  const report = buildReport();
  const output = formatReport(report);
  expect(output).toContain('opened: 2');
  expect(output).toContain('closed: 1');
});

test('buildReport generatedAt is a valid ISO string', () => {
  const report = buildReport();
  expect(() => new Date(report.generatedAt)).not.toThrow();
});
