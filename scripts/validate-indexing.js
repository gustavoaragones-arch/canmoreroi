#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { SITE, canonicalForRelPath } = require('./canonical-urls');
const { INDEXING_PARAM_KEYS, hasIndexingParams } = require('./seo-params');
const { fixInternalHrefs } = require('./seo-links');

const ROOT = path.join(__dirname, '..');
const FIX = process.argv.includes('--fix');

const INDEXABLE_NOINDEX_BLOCKLIST = new Set(['analysis/dynamic.html', 'analysis/template.html']);
const PARAM_HREF_RE = new RegExp(
  'href="[^"]*\\?(?:[^"]*(?:' + INDEXING_PARAM_KEYS.join('|') + ')=)',
  'i'
);

function walkHtml(dir, acc) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'scripts' || name === 'data' || name === 'vendor') return;
      walkHtml(full, acc);
    } else if (name.endsWith('.html')) {
      acc.push(path.relative(ROOT, full));
    }
  });
}

function fixJsonLdAndSchemaUrls(html) {
  let out = html;
  out = out.replace(/https:\/\/canmoreroi\.com\/index\.html#/g, SITE + '/#');
  out = out.replace(/https:\/\/canmoreroi\.com\/index\.html"/g, SITE + '/"');
  out = out.replace(/https:\/\/canmoreroi\.com\/knowledge\/index\.html/g, SITE + '/knowledge/');
  out = out.replace(/https:\/\/canmoreroi\.com\/analysis\/index\.html/g, SITE + '/analysis/');
  out = out.replace(/href="\.\.\/analysis\/dynamic\.html"/g, 'href="/#analysis"');
  out = out.replace(/href="\/analysis\/dynamic\.html"/g, 'href="/#analysis"');
  return out;
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function detectRedirectChains(redirects) {
  const warnings = [];
  const exact = new Map();
  redirects.forEach(function (r) {
    if (r.has) return;
    exact.set(r.source, r.destination);
  });
  exact.forEach(function (dest, src) {
    exact.forEach(function (dest2, src2) {
      if (src2 === src) return;
      if (dest === src2) {
        warnings.push('Redirect chain risk: ' + src + ' → ' + dest + ' → ' + src2);
      }
    });
  });
  return warnings;
}

function hasAccidentalNoindex(html, rel) {
  if (INDEXABLE_NOINDEX_BLOCKLIST.has(rel)) return false;
  if (!/<meta\s+name="robots"[^>]*noindex/i.test(html)) return false;
  if (/data-seo-static="noindex"/i.test(html)) return false;
  return true;
}

function main() {
  const warnings = [];
  const files = [];
  walkHtml(ROOT, files);

  if (FIX) {
    files.forEach(function (rel) {
      if (rel === 'analysis/template.html') return;
      let html = readText(rel);
      const fixed = fixJsonLdAndSchemaUrls(fixInternalHrefs(html, rel));
      if (fixed !== html) fs.writeFileSync(path.join(ROOT, rel), fixed, 'utf8');
    });
    console.log('Applied indexing fixes where needed.');
  }

  const indexHtml = readText('index.html');
  if (!indexHtml.includes('js/seo/canonical-engine.js')) {
    warnings.push('MISSING canonical-engine.js on index.html');
  }
  if (!indexHtml.includes('CanonicalEngine.apply')) {
    warnings.push('MISSING CanonicalEngine.apply after URL sync on index.html');
  }
  if (!readText('analysis/dynamic.html').includes('noindex')) {
    warnings.push('MISSING noindex on analysis/dynamic.html');
  }

  const engineJs = readText('js/seo/canonical-engine.js');
  INDEXING_PARAM_KEYS.forEach(function (key) {
    if (!engineJs.includes("'" + key + "'")) {
      warnings.push('canonical-engine.js missing param key: ' + key);
    }
  });

  files.forEach(function (rel) {
    if (rel === 'analysis/template.html') return;
    const html = readText(rel);
    const expected = canonicalForRelPath(rel);
    const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (!m) {
      warnings.push('MISSING canonical: ' + rel);
    } else if (m[1] !== expected) {
      warnings.push('WRONG canonical ' + rel + ': ' + m[1] + ' (expected ' + expected + ')');
    }
    if (/href="[^"]*index\.html/i.test(html)) {
      warnings.push('index.html in href: ' + rel);
    }
    if (/https:\/\/canmoreroi\.com\/index\.html/i.test(html)) {
      warnings.push('index.html in JSON-LD/schema: ' + rel);
    }
    if (/rel="canonical"\s+href="[^"]*\?/.test(html)) {
      warnings.push('Parameterized canonical: ' + rel);
    }
    if (PARAM_HREF_RE.test(html)) {
      warnings.push('Crawlable param href: ' + rel);
    }
    if (/href="[^"]*\/analysis\/dynamic\.html"/i.test(html) && !INDEXABLE_NOINDEX_BLOCKLIST.has(rel)) {
      warnings.push('Crawlable link to dynamic.html: ' + rel);
    }
    if (hasAccidentalNoindex(html, rel)) {
      warnings.push('Accidental noindex on indexable page: ' + rel);
    }
    if (/http:\/\/canmoreroi\.com/i.test(html)) {
      warnings.push('HTTP (non-HTTPS) URL in: ' + rel);
    }
  });

  const sitemap = readText('sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const sitemapSet = new Set(locs);
  locs.forEach(function (loc) {
    if (loc.includes('?')) warnings.push('Sitemap param URL: ' + loc);
    if (loc.includes('index.html')) warnings.push('Sitemap index.html URL: ' + loc);
    if (!loc.startsWith('https://canmoreroi.com/')) warnings.push('Sitemap non-absolute URL: ' + loc);
    if (loc.endsWith('/dynamic') || loc.includes('dynamic.html')) {
      warnings.push('Sitemap includes dynamic tool URL: ' + loc);
    }
  });

  files.forEach(function (rel) {
    if (rel === 'analysis/template.html' || INDEXABLE_NOINDEX_BLOCKLIST.has(rel)) return;
    const expected = canonicalForRelPath(rel);
    if (!sitemapSet.has(expected) && !rel.startsWith('analysis/template')) {
      /* dynamic excluded from sitemap by design; all indexable pages should be listed */
      if (rel !== 'analysis/dynamic.html') {
        const inSitemap = [...sitemapSet].some(function (u) {
          return u.endsWith('/' + rel.replace(/\.html$/, '')) || u.endsWith('/' + rel);
        });
        if (!inSitemap && expected.includes('/analysis/') && !expected.endsWith('/analysis/')) {
          if (!sitemapSet.has(expected)) {
            warnings.push('Canonical URL missing from sitemap: ' + expected + ' (' + rel + ')');
          }
        }
      }
    }
  });

  const robots = readText('robots.txt');
  INDEXING_PARAM_KEYS.forEach(function (key) {
    if (!robots.includes('/*?' + key + '=')) {
      warnings.push('robots.txt missing Disallow for ?' + key + '=');
    }
  });
  if (!robots.includes('Sitemap:')) warnings.push('robots.txt missing Sitemap declaration');

  const vercel = JSON.parse(readText('vercel.json'));
  const redirectSources = vercel.redirects.map((r) => r.source);
  ['/index.html', '/analysis/index.html', '/knowledge/index.html'].forEach(function (src) {
    if (!redirectSources.includes(src)) {
      warnings.push('vercel.json missing redirect: ' + src);
    }
  });
  var hasWwwRedirect = vercel.redirects.some(function (r) {
    return (
      r.has &&
      r.has.some(function (h) {
        return h.type === 'host' && h.value === 'www.canmoreroi.com';
      })
    );
  });
  if (!hasWwwRedirect) {
    warnings.push('vercel.json missing www → apex redirect');
  }
  detectRedirectChains(vercel.redirects).forEach(function (w) {
    warnings.push(w);
  });

  if (!hasIndexingParams('?price=850000&down=20')) {
    warnings.push('seo-params hasIndexingParams self-test failed');
  }

  if (warnings.length) {
    console.log('Indexing validation warnings (' + warnings.length + '):\n');
    warnings.forEach(function (w) {
      console.log('  -', w);
    });
    if (!FIX) console.log('\nRun: node scripts/validate-indexing.js --fix');
    process.exit(1);
  }

  console.log('Indexing validation passed.');
  console.log('  HTML files:', files.length);
  console.log('  Sitemap URLs:', locs.length);
  console.log('  Param keys blocked:', INDEXING_PARAM_KEYS.join(', '));
}

main();
