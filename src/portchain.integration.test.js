// integration test — portchain pipeline with real-ish data shapes

const { processEntries, runChain, buildChain } = require('./portchain');

const sampleEntries = [
  { port: 80,   protocol: 'tcp', process: 'nginx',    pid: 100 },
  { port: 443,  protocol: 'tcp', process: 'nginx',    pid: 100 },
  { port: 3000, protocol: 'tcp', process: 'node',     pid: 200 },
  { port: 5432, protocol: 'tcp', process: 'postgres', pid: 300 },
  { port: 6379, protocol: 'udp', process: 'redis',    pid: 400 },
];

describe('portchain integration', () => {
  it('runs a multi-step custom chain end to end', async () => {
    const chain = buildChain([
      {
        name: 'tcp-only',
        fn: (entries) => entries.filter(e => e.protocol === 'tcp'),
      },
      {
        name: 'add-flag',
        fn: (entries) => entries.map(e => ({ ...e, processed: true })),
      },
      {
        name: 'sort-port',
        fn: (entries) => [...entries].sort((a, b) => a.port - b.port),
      },
    ]);

    const result = await runChain(sampleEntries, chain);

    expect(result.every(e => e.protocol === 'tcp')).toBe(true);
    expect(result.every(e => e.processed === true)).toBe(true);
    expect(result.map(e => e.port)).toEqual([80, 443, 3000, 5432]);
  });

  it('processEntries with no opts returns full list', async () => {
    const result = await processEntries(sampleEntries, {});
    expect(result).toHaveLength(sampleEntries.length);
  });

  it('handles empty entries gracefully', async () => {
    const result = await processEntries([], { resolve: true, label: true });
    expect(result).toEqual([]);
  });

  it('non-strict mode continues after bad step', async () => {
    const chain = buildChain([
      { name: 'explode', fn: () => { throw new Error('boom'); } },
      { name: 'mark',    fn: (e) => e.map(x => ({ ...x, survived: true })) },
    ]);
    const result = await runChain(sampleEntries, chain, { strict: false });
    expect(result.every(e => e.survived)).toBe(true);
  });

  it('strict mode halts on first bad step', async () => {
    const chain = buildChain([
      { name: 'explode', fn: () => { throw new Error('halt'); } },
      { name: 'never',   fn: (e) => e },
    ]);
    await expect(runChain(sampleEntries, chain, { strict: true })).rejects.toThrow('halt');
  });
});
