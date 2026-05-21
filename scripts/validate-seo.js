#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { SITE, canonicalForRelPath } = require('./canonical-urls');
const { fixInternalHrefs } = require('./seo-links');

/** Pages that intentionally share the same canonical (e.g. analysis hub + dynamic). */
const SHARED_CANONICAL_OK = new Set([SITE + '/analysis/']);

const ROOT = path.join(__dirname, '..');
const FIX = process.argv.includes('--fix');

const SKIP_FILES = new Set(['analysis/template.html', 'BingSiteAuth.xml']);

function walkHtml(dir, acc) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'scripts' || name === 'data') return;
      walkHtml(full, acc);
    } else if (name.endsWith('.html')) {
      acc.push(path.relative(ROOT, full));
    }
  });
}

function upsertCanonical(html, canonical) {
  const tag = '<link rel="canonical" href="' + canonical + '" />';
  if (/<link\s+rel="canonical"/i.test(html)) {
    return html.replace(/<link\s+rel="canonical"[^>]*>/i, tag);
  }
  return html.replace(/<meta charset="UTF-8"\s*\/>/i, function (m) {
    return m + '\n  ' + tag;
  });
}

function collectCanonicals(html) {
  const found = [];
  const re = /<link\s+rel="canonical"\s+href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) found.push(m[1]);
  return found;
}

function main() {
  const files = [];
  walkHtml(ROOT, files);
  const warnings = [];
  const canonicalMap = new Map();

  files.forEach(function (rel) {
    if (SKIP_FILES.has(rel)) return;
    const full = path.join(ROOT, rel);
    let html = fs.readFileSync(full, 'utf8');
    const expected = canonicalForRelPath(rel);

    if (FIX) {
      html = fixInternalHrefs(html, rel);
      html = upsertCanonical(html, expected);
      fs.writeFileSync(full, html, 'utf8');
    }

    const canon = collectCanonicals(html);
    if (canon.length === 0) {
      warnings.push('MISSING canonical: ' + rel + ' (expected ' + expected + ')');
    } else if (canon.length > 1) {
      warnings.push('DUPLICATE canonical tags (' + canon.length + '): ' + rel);
    } else if (canon[0] !== expected) {
      warnings.push('WRONG canonical in ' + rel + ': ' + canon[0] + ' (expected ' + expected + ')');
    }

    if (canon[0] && canonicalMap.has(canon[0]) && !SHARED_CANONICAL_OK.has(canon[0])) {
      warnings.push('DUPLICATE canonical URL across pages: ' + canon[0] + ' (' + canonicalMap.get(canon[0]) + ', ' + rel + ')');
    } else if (canon[0]) {
      canonicalMap.set(canon[0], rel);
    }

    if (/href="[^"]*index\.html/i.test(html)) {
      const hits = html.match(/href="[^"]*index\.html[^"]*"/gi) || [];
      hits.forEach(function (h) {
        warnings.push('index.html in href: ' + rel + ' → ' + h);
      });
    }
  });

  if (FIX) {
    console.log('Applied canonical tags and internal link fixes to', files.length, 'HTML files (except skipped).');
  }

  if (warnings.length) {
    console.log('\nSEO validation warnings (' + warnings.length + '):\n');
    warnings.forEach(function (w) {
      console.log('  -', w);
    });
    if (!FIX) {
      console.log('\nRun: node scripts/validate-seo.js --fix');
    }
    process.exit(1);
  }

  console.log('SEO validation passed (' + files.length + ' HTML files checked).');
}

main();
