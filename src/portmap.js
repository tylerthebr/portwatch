const { loadWatchlist } = require('./watchlist');
const { getTags } = require('./tags');
const { getLabelForPort } = require('./portlabel');
const { getProfile } = require('./profile');

/**
 * Build a full port map: merges watchlist, tags, labels, and profile info
 * into a unified lookup keyed by port number.
 */
function buildPortMap(entries, profileName = null) {
  const watchlist = loadWatchlist();
  const tags = getTags();
  const profile = profileName ? getProfile(profileName) : null;

  const map = {};

  for (const entry of entries) {
    const port = entry.port;
    const label = getLabelForPort(port);
    const entryTags = tags[port] ? [].concat(tags[port]) : [];
    const watched = watchlist.includes(port);
    const profileMatch = profile && profile.ports ? profile.ports.includes(port) : false;

    map[port] = {
      ...entry,
      label: label || entry.process || null,
      tags: entryTags,
      watched,
      profileMatch,
    };
  }

  return map;
}

/**
 * Flatten a port map back into a sorted array of entries.
 */
function flattenPortMap(portMap) {
  return Object.values(portMap).sort((a, b) => a.port - b.port);
}

/**
 * Look up a single port in the map.
 */
function getPortEntry(portMap, port) {
  return portMap[port] || null;
}

/**
 * Filter map to only watched ports.
 */
function getWatchedEntries(portMap) {
  return Object.values(portMap).filter(e => e.watched);
}

module.exports = { buildPortMap, flattenPortMap, getPortEntry, getWatchedEntries };
