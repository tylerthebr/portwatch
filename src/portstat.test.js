const { getPortStat, enrichWithStats, summarizeStats } = require('./portstat');

describe('portstat', () => {
  const mockEntry = { port: 3000, protocol: 'tcp', process: 'node', pid: 1234 };
  const mockEntry2 = { port: 8080, protocol: 'tcp', process: 'python', pid: 5678 };

  describe('getPortStat', () => {
    it('returns a stat object with expected fields', () => {
      const stat = getPortStat(mockEntry);
      expect(stat).toHaveProperty('port', 3000);
      expect(stat).toHaveProperty('protocol', 'tcp');
      expect(stat).toHaveProperty('process', 'node');
      expect(stat).toHaveProperty('pid', 1234);
      expect(stat).toHaveProperty('connections');
      expect(stat).toHaveProperty('timestamp');
      expect(typeof stat.connections).toBe('number');
    });

    it('defaults process to unknown if missing', () => {
      const stat = getPortStat({ port: 9000 });
      expect(stat.process).toBe('unknown');
      expect(stat.pid).toBeNull();
    });

    it('defaults protocol to tcp if missing', () => {
      const stat = getPortStat({ port: 9000 });
      expect(stat.protocol).toBe('tcp');
    });
  });

  describe('enrichWithStats', () => {
    it('adds stat field to each entry', () => {
      const enriched = enrichWithStats([mockEntry, mockEntry2]);
      expect(enriched).toHaveLength(2);
      enriched.forEach(e => {
        expect(e).toHaveProperty('stat');
        expect(e.stat).toHaveProperty('port');
        expect(e.stat).toHaveProperty('connections');
      });
    });

    it('preserves original entry fields', () => {
      const enriched = enrichWithStats([mockEntry]);
      expect(enriched[0].port).toBe(3000);
      expect(enriched[0].process).toBe('node');
    });

    it('returns empty array for empty input', () => {
      expect(enrichWithStats([])).toEqual([]);
    });
  });

  describe('summarizeStats', () => {
    it('returns summary object with correct shape', () => {
      const summary = summarizeStats([mockEntry, mockEntry2]);
      expect(summary).toHaveProperty('totalPorts', 2);
      expect(summary).toHaveProperty('totalConnections');
      expect(summary).toHaveProperty('busiestPort');
      expect(summary).toHaveProperty('busiestProcess');
      expect(summary).toHaveProperty('generatedAt');
    });

    it('handles empty array gracefully', () => {
      const summary = summarizeStats([]);
      expect(summary.totalPorts).toBe(0);
      expect(summary.totalConnections).toBe(0);
      expect(summary.busiestPort).toBeNull();
    });
  });
});
