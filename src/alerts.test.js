const { AlertManager } = require('./alerts');
const { exec } = require('child_process');

jest.mock('child_process');

describe('AlertManager', () => {
  let alertManager;
  let execMock;

  beforeEach(() => {
    execMock = jest.fn((cmd, callback) => callback(null, '', ''));
    exec.mockImplementation(execMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      alertManager = new AlertManager();
      expect(alertManager.config.desktop).toBe(true);
      expect(alertManager.config.sound).toBe(false);
      expect(alertManager.config.webhook).toBe(null);
    });

    it('should accept custom config', () => {
      alertManager = new AlertManager({
        desktop: false,
        sound: true,
        webhook: 'https://example.com/hook'
      });
      expect(alertManager.config.desktop).toBe(false);
      expect(alertManager.config.sound).toBe(true);
      expect(alertManager.config.webhook).toBe('https://example.com/hook');
    });
  });

  describe('sendDesktopNotification', () => {
    it('should skip if desktop notifications disabled', async () => {
      alertManager = new AlertManager({ desktop: false });
      await alertManager.sendDesktopNotification('Test', 'Message');
      expect(execMock).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      alertManager = new AlertManager({ desktop: true });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      execMock.mockImplementation((cmd, callback) => callback(new Error('Command failed'), '', ''));
      
      await alertManager.sendDesktopNotification('Test', 'Message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendWebhook', () => {
    it('should skip if webhook not configured', async () => {
      alertManager = new AlertManager();
      const result = await alertManager.sendWebhook({ test: 'data' });
      expect(result).toBeUndefined();
    });

    it('should handle webhook errors gracefully', async () => {
      alertManager = new AlertManager({ webhook: 'invalid-url' });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await alertManager.sendWebhook({ test: 'data' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('alertOnChanges', () => {
    beforeEach(() => {
      alertManager = new AlertManager({ desktop: true });
      jest.spyOn(alertManager, 'sendDesktopNotification').mockResolvedValue();
      jest.spyOn(alertManager, 'sendWebhook').mockResolvedValue();
    });

    it('should not alert when no changes', async () => {
      const diff = { added: [], removed: [], changed: [] };
      await alertManager.alertOnChanges(diff);
      
      expect(alertManager.sendDesktopNotification).not.toHaveBeenCalled();
      expect(alertManager.sendWebhook).not.toHaveBeenCalled();
    });

    it('should alert when changes detected', async () => {
      const diff = {
        added: [{ port: 3000, pid: 1234, command: 'node' }],
        removed: [{ port: 8080, pid: 5678, command: 'python' }],
        changed: []
      };
      
      await alertManager.alertOnChanges(diff);
      
      expect(alertManager.sendDesktopNotification).toHaveBeenCalledWith(
        'PortWatch: Port Changes Detected',
        '1 new, 1 closed, 0 changed'
      );
      expect(alertManager.sendWebhook).toHaveBeenCalled();
    });
  });
});
