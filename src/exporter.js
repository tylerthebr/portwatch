const fs = require('fs');
const path = require('path');

/**
 * Export port snapshot data to JSON format
 */
function exportToJSON(snapshot, outputPath) {
  const data = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath, data, 'utf8');
  return outputPath;
}

/**
 * Export port snapshot data to CSV format
 */
function exportToCSV(snapshot, outputPath) {
  const headers = ['port', 'protocol', 'process', 'pid', 'state'];
  const rows = snapshot.ports.map(entry => [
    entry.port,
    entry.protocol || '',
    entry.process || '',
    entry.pid || '',
    entry.state || ''
  ]);

  const lines = [
    headers.join(','),
    ...rows.map(row => row.map(v => `"${v}"`).join(','))
  ];

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  return outputPath;
}

/**
 * Export diff results to a human-readable text report
 */
function exportDiffReport(diff, outputPath, timestamp) {
  const ts = timestamp || new Date().toISOString();
  const lines = [
    `Port Change Report — ${ts}`,
    '='.repeat(40),
    '',
    `Added ports (${diff.added.length}):`,
    ...diff.added.map(p => `  + ${p.port}/${p.protocol || 'tcp'} (${p.process || 'unknown'})`),
    '',
    `Removed ports (${diff.removed.length}):`,
    ...diff.removed.map(p => `  - ${p.port}/${p.protocol || 'tcp'} (${p.process || 'unknown'})`),
    ''
  ];

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  return outputPath;
}

/**
 * Resolve export format from file extension or explicit format string
 */
function resolveFormat(outputPath, format) {
  if (format) return format.toLowerCase();
  const ext = path.extname(outputPath).toLowerCase();
  if (ext === '.csv') return 'csv';
  if (ext === '.txt') return 'txt';
  return 'json';
}

module.exports = { exportToJSON, exportToCSV, exportDiffReport, resolveFormat };
