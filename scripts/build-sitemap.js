#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://canmoreroi.com';
const LAST_MAIN = '2026-03-28';

function listHtml(dir, exclude) {
  const ex = new Set(exclude || []);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.html') && !ex.has(f))
    .sort();
}

const urls = [];

urls.push({ loc: `${BASE}/`, priority: '1.0', lastmod: LAST_MAIN });
urls.push({ loc: `${BASE}/analysis/index.html`, priority: '0.9', lastmod: LAST_MAIN });

listHtml(path.join(ROOT, 'analysis'), ['template.html']).forEach((f) => {
  urls.push({ loc: `${BASE}/analysis/${f}`, priority: '0.8', lastmod: LAST_MAIN });
});

listHtml(path.join(ROOT, 'guides')).forEach((f) => {
  urls.push({ loc: `${BASE}/guides/${f}`, priority: '0.85', lastmod: LAST_MAIN });
});

listHtml(path.join(ROOT, 'knowledge')).forEach((f) => {
  urls.push({ loc: `${BASE}/knowledge/${f}`, priority: '0.88', lastmod: LAST_MAIN });
});

listHtml(path.join(ROOT, 'areas')).forEach((f) => {
  urls.push({ loc: `${BASE}/areas/${f}`, priority: '0.82', lastmod: LAST_MAIN });
});

listHtml(path.join(ROOT, 'scenarios')).forEach((f) => {
  urls.push({ loc: `${BASE}/scenarios/${f}`, priority: '0.82', lastmod: LAST_MAIN });
});

['terms.html', 'privacy.html', 'disclaimer.html', 'cookies.html'].forEach((f) => {
  urls.push({ loc: `${BASE}/legal/${f}`, priority: '0.3', lastmod: LAST_MAIN });
});

const body =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(function (u) {
      return (
        '  <url>\n' +
        `    <loc>${u.loc}</loc>\n` +
        `    <lastmod>${u.lastmod}</lastmod>\n` +
        `    <priority>${u.priority}</priority>\n` +
        '  </url>'
      );
    })
    .join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), body, 'utf8');
console.log('Wrote sitemap.xml with', urls.length, 'URLs');
