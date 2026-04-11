const { buildChain, runChain, defaultChain, processEntries } = require('./portchain');

const mockEntries = [
  { port: 3000, protocol: 'tcp', process: 'node' },
  { port: 5432, protocol: 'tcp', process: 'postgres' },
  { port: 8080, protocol: 'tcp', process: 'nginx' },
];

describe('buildChain', () => {
  it('filters out falsy steps', () => {
    const chain = buildChain([null, { name: 'a', fn: x => x }, undefined]);
    expect(chain).toHaveLength(1);
    expect(chain[0].name).toBe('a');
  });

  it('returns empty array for empty input', () => {
    expect(buildChain([])).toEqual([]);
  });
});

describe('runChain', () => {
  it('applies steps in order', async () => {
    const log = [];
    const chain = [
      { name: 'first', fn: (e) => { log.push('first'); return e; } },
      { name: 'second', fn: (e) => { log.push('second'); return e; } },
    ];
    await runChain(mockEntries, chain);
    expect(log).toEqual(['first', 'second']);
  });

  it('passes entries through each step', async () => {
    const chain = [
      { name: 'filter', fn: (e) => e.filter(x => x.port !== 8080) },
    ];
    const result = await runChain(mockEntries, chain);
    expect(result).toHaveLength(2);
    expect(result.find(e => e.port === 8080)).toBeUndefined();
  });

  it('skips failing steps in non-strict mode', async () => {
    const chain = [
      { name: 'bad', fn: () => { throw new Error('oops'); } },
      { name: 'good', fn: (e) => e.map(x => ({ ...x, tagged: true })) },
    ];
    const result = await runChain(mockEntries, chain, { strict: false });
    expect(result[0].tagged).toBe(true);
  });

  it('throws in strict mode on step failure', async () => {
    const chain = [{ name: 'bad', fn: () => { throw new Error('strict fail'); } }];
    await expect(runChain(mockEntries, chain, { strict: true })).rejects.toThrow('strict fail');
  });
});

describe('defaultChain', () => {
  it('returns empty chain with no opts', () => {
    expect(defaultChain({})).toHaveLength(0);
  });

  it('includes filter step when filter opt set', () => {
    const chain = defaultChain({ filter: { protocol: 'tcp' } });
    expect(chain.some(s => s.name === 'filter')).toBe(true);
  });
});

describe('processEntries', () => {
  it('returns entries unchanged with no opts', async () => {
    const result = await processEntries(mockEntries, {});
    expect(result).toHaveLength(mockEntries.length);
  });
});
