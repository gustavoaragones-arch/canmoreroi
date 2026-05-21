'use strict';

const SITE = 'https://canmoreroi.com';

/**
 * Canonical URL for a repo-relative HTML path (e.g. "guides/foo.html", "analysis/index.html").
 */
function canonicalForRelPath(relPath) {
  const rel = String(relPath).replace(/\\/g, '/');
  if (rel === 'index.html') return SITE + '/';
  if (rel.endsWith('/index.html')) {
    const dir = rel.slice(0, -'/index.html'.length);
    return SITE + '/' + dir + '/';
  }
  if (rel === 'analysis/dynamic.html' || rel === 'analysis/template.html') {
    return SITE + '/analysis/';
  }
  if (rel.startsWith('analysis/') && rel.endsWith('.html')) {
    return SITE + '/' + rel.slice(0, -'.html'.length);
  }
  return SITE + '/' + rel;
}

/** Generated property analysis pages: /analysis/{slug} */
function analysisPropertyCanonical(slug) {
  return SITE + '/analysis/' + String(slug).replace(/^\//, '').replace(/\.html$/, '');
}

module.exports = {
  SITE,
  canonicalForRelPath,
  analysisPropertyCanonical,
};
