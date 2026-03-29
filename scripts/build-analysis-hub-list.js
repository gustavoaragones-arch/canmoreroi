#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DATA = path.join(__dirname, '..', 'data');
const SKIP = new Set(['schema.json', 'example.json']);
const items = [];
fs.readdirSync(DATA).forEach(function (f) {
  if (!f.endsWith('.json') || SKIP.has(f)) return;
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  items.push({ slug: d.slug, title: d.title });
});
items.sort(function (a, b) {
  return a.title.localeCompare(b.title);
});

const lis = items
  .map(function (x) {
    return (
      '          <li><a href="/analysis/' +
      escapeHtml(x.slug) +
      '.html" class="text-brand-green underline decoration-brand-gold/60 underline-offset-4">' +
      escapeHtml(x.title) +
      '</a></li>'
    );
  })
  .join('\n');

const block =
  '    <section class="border-t border-neutral-200/80 bg-brand-cream px-6 py-14 md:px-8 md:py-20" aria-labelledby="all-analyses-heading">\n' +
  '      <div class="mx-auto max-w-4xl">\n' +
  '        <h2 id="all-analyses-heading" class="font-serif text-2xl font-semibold text-brand-green md:text-3xl">All property analyses</h2>\n' +
  '        <p class="mt-3 text-sm text-neutral-600">Every modeled property — positive, break-even, and negative carry.</p>\n' +
  '        <ul class="mt-6 columns-1 gap-x-8 text-sm md:columns-2 md:text-base">\n' +
  lis +
  '\n        </ul>\n' +
  '      </div>\n' +
  '    </section>\n';

const hubPath = path.join(__dirname, '..', 'analysis', 'index.html');
let html = fs.readFileSync(hubPath, 'utf8');
const start = '<!--ALL_ANALYSES_LIST-->';
const end = '<!--/ALL_ANALYSES_LIST-->';
if (html.indexOf(start) === -1) {
  console.error('Missing markers in analysis/index.html');
  process.exit(1);
}
html = html.replace(new RegExp(start + '[\\s\\S]*?' + end, 'm'), start + '\n' + block + end);
fs.writeFileSync(hubPath, html, 'utf8');
console.log('Updated analysis hub list (' + items.length + ' items)');
