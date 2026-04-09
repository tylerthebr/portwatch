const { execSync } = require('child_process');
const os = require('os');

/**
 * Send a desktop notification based on the current platform.
 * Falls back to console output if notifications aren't supported.
 */
function sendNotification(title, message) {
  const platform = os.platform();

  try {
    if (platform === 'darwin') {
      const escaped = message.replace(/'/g, "'\\''");
      const escapedTitle = title.replace(/'/g, "'\\''");
      execSync(`osascript -e 'display notification "${escaped}" with title "${escapedTitle}"'`);
      return true;
    }

    if (platform === 'linux') {
      execSync(`notify-send "${title}" "${message}"`);
      return true;
    }

    if (platform === 'win32') {
      const ps = `[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')`;
      execSync(`powershell -Command "${ps}"`);
      return true;
    }
  } catch (err) {
    // notification failed silently, fall through
  }

  return false;
}

/**
 * Build a human-readable summary from a diff result.
 */
function buildNotificationMessage(diff) {
  const parts = [];

  if (diff.added.length > 0) {
    const ports = diff.added.map(p => p.port).join(', ');
    parts.push(`+${diff.added.length} new port(s): ${ports}`);
  }

  if (diff.removed.length > 0) {
    const ports = diff.removed.map(p => p.port).join(', ');
    parts.push(`-${diff.removed.length} closed port(s): ${ports}`);
  }

  return parts.join(' | ');
}

/**
 * Notify the user about port changes if any exist.
 * Returns true if a notification was sent.
 */
function notifyOnChanges(diff) {
  const hasChanges = diff.added.length > 0 || diff.removed.length > 0;
  if (!hasChanges) return false;

  const message = buildNotificationMessage(diff);
  const sent = sendNotification('portwatch', message);

  if (!sent) {
    console.log(`[portwatch] ${message}`);
  }

  return true;
}

module.exports = { sendNotification, buildNotificationMessage, notifyOnChanges };
