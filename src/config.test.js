const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  loadConfig,
  saveConfig,
  updateConfig,
  resetConfig,
  getConfigPath,
  DEFAULT_CONFIG
} = require('./config');

jest.mock('fs');
jest.mock('os');

describe('Config', () => {
  const mockHomeDir = '/home/testuser';
  const mockConfigDir = path.join(mockHomeDir, '.portwatch');
  const mockConfigFile = path.join(mockConfigDir, 'config.json');

  beforeEach(() => {
    os.homedir.mockReturnValue(mockHomeDir);
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.readFileSync.mockImplementation(() => '{}');
    fs.writeFileSync.mockImplementation(() => {});
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should load and merge user config with defaults', () => {
      fs.existsSync.mockReturnValue(true);
      const userConfig = {
        alerts: { desktop: false },
        watch: { interval: 10000 }
      };
      fs.readFileSync.mockReturnValue(JSON.stringify(userConfig));

      const config = loadConfig();
      expect(config.alerts.desktop).toBe(false);
      expect(config.alerts.sound).toBe(false); // from defaults
      expect(config.watch.interval).toBe(10000);
    });

    it('should return defaults on parse error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should create config directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      loadConfig();
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const config = { ...DEFAULT_CONFIG };
      const result = saveConfig(config);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(config, null, 2),
        'utf8'
      );
      expect(result).toBe(true);
    });

    it('should return false on write error', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = saveConfig(DEFAULT_CONFIG);
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateConfig', () => {
    it('should update specific config values', () => {
      fs.existsSync.mockReturnValue(false);
      
      const updates = {
        alerts: { webhook: 'https://example.com' },
        watch: { interval: 3000 }
      };
      
      const result = updateConfig(updates);
      expect(result.alerts.webhook).toBe('https://example.com');
      expect(result.watch.interval).toBe(3000);
      expect(result.alerts.desktop).toBe(true); // unchanged default
    });
  });

  describe('resetConfig', () => {
    it('should reset config to defaults', () => {
      resetConfig();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(DEFAULT_CONFIG, null, 2),
        'utf8'
      );
    });
  });

  describe('getConfigPath', () => {
    it('should return config file path', () => {
      expect(getConfigPath()).toBe(mockConfigFile);
    });
  });
});
