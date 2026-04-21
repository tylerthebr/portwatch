const {
  buildCompareChain,
  getChainSummary,
  formatCompareChain
} = require('./portwatch-snapshot-compare-chain');

const makeSnapshot = (timestamp, ports) => ({ timestamp, ports });
const makePort = (port, pid = 1234) => ({ port, pid, protocol: 'tcp', process: 'node' });

describe('buildCompareChain', () => {
  it('returns empty array for fewer than 2 snapshots', () => {
    expect(buildCompareChain([])).toEqual([]);
    expect(buildCompareChain([makeSnapshot('t1', [])])).toEqual([]);
  });

  it('builds a chain with one step for two snapshots', () => {
    const history = [
      makeSnapshot('2024-01-01T00:00:00Z', [makePort(3000)]),
      makeSnapshot('2024-01-01T01:00:00Z', [makePort(3000), makePort(4000)])
    ];
    const chain = buildCompareChain(history);
    expect(chain).toHaveLength(1);
    expect(chain[0].added).toBe(1);
    expect(chain[0].removed).toBe(0);
    expect(chain[0].from).toBe('2024-01-01T00:00:00Z');
    expect(chain[0].to).toBe('2024-01-01T01:00:00Z');
  });

  it('builds multiple steps for multiple snapshots', () => {
    const history = [
      makeSnapshot('t1', [makePort(3000)]),
      makeSnapshot('t2', [makePort(4000)]),
      makeSnapshot('t3', [makePort(4000), makePort(5000)])
    ];
    const chain = buildCompareChain(history);
    expect(chain).toHaveLength(2);
    expect(chain[0].removed).toBe(1);
    expect(chain[1].added).toBe(1);
  });

  it('handles snapshots with no ports', () => {
    const history = [
      makeSnapshot('t1', []),
      makeSnapshot('t2', [])
    ];
    const chain = buildCompareChain(history);
    expect(chain[0].added).toBe(0);
    expect(chain[0].removed).toBe(0);
  });
});

describe('getChainSummary', () => {
  it('returns zeros for empty chain', () => {
    const s = getChainSummary([]);
    expect(s.totalAdded).toBe(0);
    expect(s.totalRemoved).toBe(0);
    expect(s.steps).toBe(0);
  });

  it('sums added and removed across all steps', () => {
    const chain = [
      { added: 2, removed: 1, from: 't1', to: 't2', diff: {} },
      { added: 3, removed: 0, from: 't2', to: 't3', diff: {} }
    ];
    const s = getChainSummary(chain);
    expect(s.totalAdded).toBe(5);
    expect(s.totalRemoved).toBe(1);
    expect(s.steps).toBe(2);
  });

  it('identifies most active step', () => {
    const chain = [
      { added: 1, removed: 0, from: 't1', to: 't2', diff: {} },
      { added: 5, removed: 3, from: 't2', to: 't3', diff: {} }
    ];
    const s = getChainSummary(chain);
    expect(s.mostActiveStep.added).toBe(5);
  });
});

describe('formatCompareChain', () => {
  it('returns message for empty chain', () => {
    expect(formatCompareChain([])).toMatch(/no chain/i);
  });

  it('formats each step on its own line', () => {
    const chain = [
      { from: '2024-01-01T00:00:00Z', to: '2024-01-01T01:00:00Z', added: 2, removed: 1 },
      { from: '2024-01-01T01:00:00Z', to: '2024-01-01T02:00:00Z', added: 0, removed: 3 }
    ];
    const out = formatCompareChain(chain);
    const lines = out.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/Step 1/);
    expect(lines[1]).toMatch(/Step 2/);
    expect(lines[0]).toMatch(/\+2/);
    expect(lines[1]).toMatch(/-3/);
  });
});
