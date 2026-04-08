import { parsePortOutput } from './scanner.js';

const SAMPLE_OUTPUT = `
Netid  State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
tcp    LISTEN  0       128     0.0.0.0:3000         0.0.0.0:*          users:(("node",pid=1234,fd=18))
tcp    LISTEN  0       128     0.0.0.0:5432         0.0.0.0:*          users:(("postgres",pid=5678,fd=5))
udp    UNCONN  0       0       0.0.0.0:68           0.0.0.0:*
`.trim();

describe('parsePortOutput', () => {
  it('parses multiple port entries correctly', () => {
    const result = parsePortOutput(SAMPLE_OUTPUT);
    expect(result.length).toBe(3);
  });

  it('extracts port numbers correctly', () => {
    const result = parsePortOutput(SAMPLE_OUTPUT);
    const ports = result.map(r => r.port);
    expect(ports).toContain(3000);
    expect(ports).toContain(5432);
    expect(ports).toContain(68);
  });

  it('extracts protocol correctly', () => {
    const result = parsePortOutput(SAMPLE_OUTPUT);
    expect(result[0].protocol).toBe('tcp');
    expect(result[2].protocol).toBe('udp');
  });

  it('extracts pid when present', () => {
    const result = parsePortOutput(SAMPLE_OUTPUT);
    expect(result[0].pid).toBe('1234');
    expect(result[1].pid).toBe('5678');
  });

  it('sets pid to null when not present', () => {
    const result = parsePortOutput(SAMPLE_OUTPUT);
    expect(result[2].pid).toBeNull();
  });

  it('returns empty array for empty input', () => {
    const result = parsePortOutput('Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port');
    expect(result).toEqual([]);
  });
});
