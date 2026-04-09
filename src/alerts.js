const os = require('os');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Alert configuration and notification system
 */

class AlertManager {
  constructor(config = {}) {
    this.config = {
      desktop: config.desktop !== false,
      sound: config.sound || false,
      webhook: config.webhook || null,
      ...config
    };
  }

  /**
   * Send desktop notification
   */
  async sendDesktopNotification(title, message) {
    if (!this.config.desktop) return;

    const platform = os.platform();
    
    try {
      if (platform === 'darwin') {
        await execAsync(`osascript -e 'display notification "${message}" with title "${title}"'`);
      } else if (platform === 'linux') {
        await execAsync(`notify-send "${title}" "${message}"`);
      } else if (platform === 'win32') {
        // Windows toast notification via PowerShell
        const script = `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; $Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $RawXml = [xml] $Template.GetXml(); $RawXml.toast.visual.binding.text[0].AppendChild($RawXml.CreateTextNode("${title}")) >.toast.visual.binding.text[1].AppendChild($RawXml.CreateTextNode("${message}")) > $null; $SerializedXml = New.Data.Xml.Dom.XmlDocument; $SerializedXml.LoadXml($RawXml.OuterXml); $Toast = [Windows.UI.Notifications.To($SerializedXml); $Toast.Tag = "PortWatch"; $Toast.Group = "PortWatch"; $NotNotifications.ToastNotificationManager]::CreateToastNotifier("PortWatch"); $Notifier.ShowToast);`;
        await execAsync(`powershell -Command "${script}"`);
      }
    } catch (error) {
      console.error('Failed to send desktop notification:', error.message);
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(payload) {
    if (!this.config.webhook) return;

    try {
      const https = require('https');
      const url = new URL(this.config.webhook);
      
      const data = JSON.stringify(payload);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    } catch (error) {
      console.error('Failed to send webhook:', error.message);
    }
  }

  /**
   * Alert on port changes
   */
  async alertOnChanges(diff) {
    const { added, removed, changed } = diff;
    const totalChanges = added.length + removed.length + changed.length;

    if (totalChanges === 0) return;

    const message = `${added.length} new, ${removed.length} closed, ${changed.length} changed`;
    
    await this.sendDesktopNotification('PortWatch: Port Changes Detected', message);
    
    await this.sendWebhook({
      event: 'port_changes',
      timestamp: new Date().toISOString(),
      summary: message,
      details: diff
    });
  }
}

module.exports = { AlertManager };
