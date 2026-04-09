const { buildNotificationMessage, notifyOnChanges } = require('./notifier');

describe('buildNotificationMessage', () => {
  it('reports added ports', () => {
    const diff = {
      added: [{ port: 3000, pid: 123, process: 'node' }, { port: 5432, pid: 456, process: 'postgres' }],
      removed: []
    };
    const msg = buildNotificationMessage(diff);
    expect(msg).toContain('+2 new port(s)');
    expect(msg).toContain('3000');
    expect(msg).toContain('5432');
  });

  it('reports removed ports', () => {
    const diff = {
      added: [],
      removed: [{ port: 8080, pid: 789, process: 'python' }]
    };
    const msg = buildNotificationMessage(diff);
    expect(msg).toContain('-1 closed port(s)');
    expect(msg).toContain('8080');
  });

  it('combines added and removed in one message', () => {
    const diff = {
      added: [{ port: 4000, pid: 1, process: 'node' }],
      removed: [{ port: 9000, pid: 2, process: 'ruby' }]
    };
    const msg = buildNotificationMessage(diff);
    expect(msg).toContain('+1 new port(s)');
    expect(msg).toContain('-1 closed port(s)');
  });

  it('returns empty string when no changes', () => {
    const diff = { added: [], removed: [] };
    const msg = buildNotificationMessage(diff);
    expect(msg).toBe('');
  });
});

describe('notifyOnChanges', () => {
  it('returns false when there are no changes', () => {
    const diff = { added: [], removed: [] };
    expect(notifyOnChanges(diff)).toBe(false);
  });

  it('returns true when there are added ports', () => {
    const diff = {
      added: [{ port: 3000, pid: 1, process: 'node' }],
      removed: []
    };
    // may or may not send a desktop notification depending on platform,
    // but should always return true when changes exist
    const result = notifyOnChanges(diff);
    expect(result).toBe(true);
  });

  it('returns true when there are removed ports', () => {
    const diff = {
      added: [],
      removed: [{ port: 8080, pid: 2, process: 'nginx' }]
    };
    const result = notifyOnChanges(diff);
    expect(result).toBe(true);
  });
});
