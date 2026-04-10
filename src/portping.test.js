const net = require('net');
const { pingPort, pingPorts, filterReachable } = require('./portping');

describe('pingPort', () => {
  let server;
  let openPort;

  beforeAll((done) => {
    server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      openPort = server.address().port;
      done();
    });
  });

  afterAll((done) => server.close(done));

  test('returns open: true for a listening port', async () => {
    const result = await pingPort(openPort);
    expect(result.open).toBe(true);
    expect(result.port).toBe(openPort);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('returns open: false for a closed port', async () => {
    const result = await pingPort(19999, '127.0.0.1', 500);
    expect(result.open).toBe(false);
  });

  test('includes host in result', async () => {
    const result = await pingPort(openPort, '127.0.0.1');
    expect(result.host).toBe('127.0.0.1');
  });
});

describe('pingPorts', () => {
  test('returns empty array for empty input', async () => {
    const result = await pingPorts([]);
    expect(result).toEqual([]);
  });

  test('returns results for multiple ports', async () => {
    const results = await pingPorts([19998, 19999], '127.0.0.1', 500);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r).toHaveProperty('open'));
  });
});

describe('filterReachable', () => {
  let server2;
  let livePort;

  beforeAll((done) => {
    server2 = net.createServer();
    server2.listen(0, '127.0.0.1', () => {
      livePort = server2.address().port;
      done();
    });
  });

  afterAll((done) => server2.close(done));

  test('returns only entries with open ports', async () => {
    const entries = [
      { port: livePort, process: 'node' },
      { port: 19997, process: 'ghost' },
    ];
    const reachable = await filterReachable(entries, '127.0.0.1', 500);
    expect(reachable).toHaveLength(1);
    expect(reachable[0].port).toBe(livePort);
  });

  test('returns empty array for empty input', async () => {
    const result = await filterReachable([]);
    expect(result).toEqual([]);
  });
});
