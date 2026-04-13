const { checkViolation, runWatchdog, dispatchViolations, formatViolation } = require('./portwatch-watchdog');

jest.mock('./watchlist', () => ({
  loadWatchlist: () => [
    { port: 3000, expectedProcess: 'node', expectedProtocol: 'tcp' },
    { port: 5432, expectedProcess: 'postgres' },
  ],
}));

jest.mock('./ignore', () => ({
  loadIgnoreList: () => [{ port: 9999 }],
}));

jest.mock('./portevents', () => ({
  emitEvent: jest.fn(),
}));

jest.mock('./throttle', () => ({
  shouldFire: jest.fn(() => true),
}));

const { emitEvent } = require('./portevents');

describe('checkViolation', () => {
  const watchlist = [
    { port: 3000, expectedProcess: 'node', expectedProtocol: 'tcp' },
  ];

  test('returns null when entry matches', () => {
    const entry = { port: 3000, process: 'node', protocol: 'tcp' };
    expect(checkViolation(entry, watchlist)).toBeNull();
  });

  test('returns process_mismatch violation', () => {
    const entry = { port: 3000, process: 'ruby', protocol: 'tcp' };
    const v = checkViolation(entry, watchlist);
    expect(v).not.toBeNull();
    expect(v.type).toBe('process_mismatch');
    expect(v.actual).toBe('ruby');
    expect(v.expected).toBe('node');
  });

  test('returns protocol_mismatch violation', () => {
    const entry = { port: 3000, process: 'node', protocol: 'udp' };
    const v = checkViolation(entry, watchlist);
    expect(v.type).toBe('protocol_mismatch');
  });

  test('returns null for unwatched port', () => {
    const entry = { port: 8080, process: 'nginx', protocol: 'tcp' };
    expect(checkViolation(entry, watchlist)).toBeNull();
  });
});

describe('runWatchdog', () => {
  test('detects violations and skips ignored ports', () => {
    const entries = [
      { port: 3000, process: 'ruby', protocol: 'tcp' },
      { port: 5432, process: 'postgres', protocol: 'tcp' },
      { port: 9999, process: 'unknown', protocol: 'tcp' },
    ];
    const violations = runWatchdog(entries);
    expect(violations).toHaveLength(1);
    expect(violations[0].port).toBe(3000);
  });

  test('returns empty array when all entries are compliant', () => {
    const entries = [
      { port: 3000, process: 'node', protocol: 'tcp' },
      { port: 5432, process: 'postgres', protocol: 'tcp' },
    ];
    expect(runWatchdog(entries)).toHaveLength(0);
  });
});

describe('dispatchViolations', () => {
  test('emits events for each violation', () => {
    emitEvent.mockClear();
    const violations = [
      { type: 'process_mismatch', port: 3000, expected: 'node', actual: 'ruby' },
    ];
    const count = dispatchViolations(violations);
    expect(count).toBe(1);
    expect(emitEvent).toHaveBeenCalledWith('watchdog:violation', violations[0]);
  });
});

describe('formatViolation', () => {
  test('formats process_mismatch', () => {
    const v = { type: 'process_mismatch', port: 3000, expected: 'node', actual: 'ruby' };
    expect(formatViolation(v)).toContain('process');
    expect(formatViolation(v)).toContain('3000');
  });

  test('formats protocol_mismatch', () => {
    const v = { type: 'protocol_mismatch', port: 3000, expected: 'tcp', actual: 'udp' };
    expect(formatViolation(v)).toContain('protocol');
  });

  test('handles unknown violation type', () => {
    const v = { type: 'weird', port: 1234 };
    expect(formatViolation(v)).toContain('unknown');
  });
});
