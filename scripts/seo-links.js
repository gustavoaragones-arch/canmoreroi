'use strict';

/** Normalize internal hrefs to canonical path style (no index.html, extensionless analysis). */
function fixInternalHrefs(html, rel) {
  let out = html;
  const reps = [
    [/href="\/index\.html#/g, 'href="/#'],
    [/href="\/index\.html"/g, 'href="/"'],
    [/href="\.\.\/index\.html#/g, 'href="/#'],
    [/href="\.\.\/index\.html"/g, 'href="/"'],
    [/href="\.\.\/analysis\/index\.html"/g, 'href="/analysis/"'],
    [/href="\/analysis\/index\.html"/g, 'href="/analysis/"'],
    [/href="analysis\/index\.html"/g, 'href="/analysis/"'],
    [/href="\.\.\/knowledge\/index\.html"/g, 'href="/knowledge/"'],
    [/href="\/knowledge\/index\.html"/g, 'href="/knowledge/"'],
    [/href="knowledge\/index\.html"/g, 'href="/knowledge/"'],
    [/href="\/analysis\/([^"/]+)\.html"/g, 'href="/analysis/$1"'],
  ];
  reps.forEach(function (pair) {
    out = out.replace(pair[0], pair[1]);
  });

  if (rel === 'index.html') {
    out = out.replace(/href="index\.html#/g, 'href="/#');
    out = out.replace(/href="index\.html"/g, 'href="/"');
  } else if (rel === 'knowledge/index.html') {
    out = out.replace(/href="index\.html"/g, 'href="/knowledge/"');
  } else if (rel.startsWith('analysis/')) {
    out = out.replace(/href="index\.html"/g, 'href="/analysis/"');
    out = out.replace(/href="([a-z0-9-]+)\.html"/g, function (m, slug) {
      if (slug === 'index' || slug === 'dynamic' || slug === 'template') return m;
      return 'href="/analysis/' + slug + '"';
    });
  } else if (rel.startsWith('knowledge/')) {
    out = out.replace(/href="index\.html"/g, 'href="/knowledge/"');
  }

  return out;
}

module.exports = { fixInternalHrefs };
