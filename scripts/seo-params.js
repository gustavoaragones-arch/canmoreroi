'use strict';

/** Query params that create share/calculator URLs — must not be indexed. */
const INDEXING_PARAM_KEYS = [
  'price',
  'down',
  'rate',
  'occ',
  'price_b',
  'down_b',
  'rate_b',
  'occ_b',
  'compare',
  'note',
  'view',
];

function hasIndexingParams(searchOrUrl) {
  if (!searchOrUrl) return false;
  var q = searchOrUrl;
  if (q.indexOf('?') >= 0) {
    q = q.slice(q.indexOf('?') + 1);
  }
  if (!q) return false;
  var p = new URLSearchParams(q);
  for (var i = 0; i < INDEXING_PARAM_KEYS.length; i++) {
    if (p.has(INDEXING_PARAM_KEYS[i])) return true;
  }
  return false;
}

module.exports = {
  INDEXING_PARAM_KEYS,
  hasIndexingParams,
};
