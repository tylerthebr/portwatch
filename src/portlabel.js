// portlabel.js — maps well-known ports to human-readable service names

const WELL_KNOWN = {
  20: 'FTP Data',
  21: 'FTP Control',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  465: 'SMTPS',
  587: 'SMTP Submission',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1521: 'Oracle DB',
  2181: 'Zookeeper',
  3000: 'Dev Server',
  3306: 'MySQL',
  4200: 'Angular Dev',
  4443: 'HTTPS Alt',
  5000: 'Flask / Dev',
  5432: 'PostgreSQL',
  5672: 'RabbitMQ',
  6379: 'Redis',
  6443: 'Kubernetes API',
  8000: 'HTTP Alt',
  8080: 'HTTP Proxy',
  8443: 'HTTPS Alt',
  8888: 'Jupyter',
  9000: 'PHP-FPM / SonarQube',
  9090: 'Prometheus',
  9200: 'Elasticsearch',
  9300: 'Elasticsearch Cluster',
  27017: 'MongoDB',
  27018: 'MongoDB Shard',
};

/**
 * Returns the well-known service label for a port number, or null.
 * @param {number|string} port
 * @returns {string|null}
 */
function getLabelForPort(port) {
  const n = parseInt(port, 10);
  if (isNaN(n)) return null;
  return WELL_KNOWN[n] || null;
}

/**
 * Annotates a port entry object with a `label` field if a known service exists.
 * @param {object} entry - must have a `port` field
 * @returns {object}
 */
function annotateEntry(entry) {
  const label = getLabelForPort(entry.port);
  return label ? { ...entry, label } : { ...entry, label: null };
}

/**
 * Annotates an array of port entries.
 * @param {object[]} entries
 * @returns {object[]}
 */
function annotateEntries(entries) {
  return entries.map(annotateEntry);
}

/**
 * Returns the full well-known port map.
 * @returns {object}
 */
function getWellKnownMap() {
  return { ...WELL_KNOWN };
}

module.exports = { getLabelForPort, annotateEntry, annotateEntries, getWellKnownMap };
