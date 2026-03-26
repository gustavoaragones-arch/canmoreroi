#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'analysis', 'template.html');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'analysis');

const SKIP_FILES = new Set(['schema.json', 'example.json']);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  const abs = Math.abs(value).toLocaleString();
  return value < 0 ? `-$${abs}` : `$${abs}`;
}

function paybackLabel(signal) {
  const k = String(signal || '').toLowerCase();
  if (k === 'self-sustaining') return '🟢 Self-Sustaining';
  if (k === 'break-even') return '🟡 Break-even';
  if (k === 'negative') return '🔴 Negative Carry';
  return '🟢 Self-Sustaining';
}

function cashflowClass(cf) {
  const n = Number(cf);
  if (n > 0) return 'py-3 text-lg font-bold tabular-nums text-green-600';
  if (n < 0) return 'py-3 text-lg font-bold tabular-nums text-red-600';
  return 'py-3 text-lg font-bold tabular-nums text-yellow-500';
}

function buildFaqBlocks(faq) {
  return (faq || [])
    .map(function (item) {
      return (
        '<div class="rounded-xl border border-neutral-200 bg-brand-cream/50 px-4 py-3">' +
        '<p class="font-semibold text-brand-green">' +
        escapeHtml(item.q) +
        '</p>' +
        '<p class="mt-2 text-sm text-neutral-600">' +
        escapeHtml(item.a) +
        '</p>' +
        '</div>'
      );
    })
    .join('\n');
}

function buildList(items) {
  return (items || [])
    .map(function (t) {
      return '<li>' + escapeHtml(t) + '</li>';
    })
    .join('');
}

function stripDataAttributes(html) {
  const names = [
    'data-title',
    'data-definition',
    'data-revenue',
    'data-costs',
    'data-cashflow',
    'data-signal',
    'data-reality',
    'data-faq',
    'data-good',
    'data-bad',
  ];
  let out = html;
  names.forEach(function (name) {
    const escaped = name.replace(/-/g, '\\-');
    // Do not use a leading \s* here — it consumes the space after the tag name when the
    // data-* attribute is first (e.g. <p data-definition class="..."> → <pclass="...">).
    const re = new RegExp(escaped + '(?:\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s>]+))?\\s*', 'g');
    out = out.replace(re, '');
  });
  out = out.replace(/"\s+>/g, '">');
  return out;
}

function buildArticleLdJson(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: 'Cash flow and ROI analysis for ' + data.title,
    author: { '@type': 'Organization', name: 'CanmoreROI.com' },
    publisher: { '@type': 'Organization', name: 'CanmoreROI.com' },
  };
}

function buildFaqLdJson(data) {
  const items = (data.faq || []).slice(0, 3);
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(function (item) {
      return {
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      };
    }),
  };
}

function tokenizeSlug(slug) {
  return String(slug)
    .toLowerCase()
    .split('-')
    .filter(Boolean);
}

function tokenOverlapScore(a, b) {
  const A = new Set(tokenizeSlug(a));
  const B = new Set(tokenizeSlug(b));
  let n = 0;
  A.forEach(function (t) {
    if (B.has(t)) n++;
  });
  return n;
}

function contextualLinkScore(currentSlug, otherSlug) {
  const c = currentSlug.toLowerCase();
  const o = otherSlug.toLowerCase();
  let s = 0;
  if (c.indexOf('solara') !== -1) {
    if (o.indexOf('condo') !== -1 || o.indexOf('downtown') !== -1 || o.indexOf('2br') !== -1) {
      s += 3;
    }
  }
  if (c.indexOf('investment') !== -1 || c.indexOf('1m') !== -1) {
    if (o.indexOf('investment') !== -1 || o.indexOf('1m') !== -1) {
      s += 3;
    } else if (o.indexOf('condo') !== -1 || o.indexOf('downtown') !== -1 || o.indexOf('solara') !== -1) {
      s += 1;
    }
  }
  if (c.indexOf('downtown') !== -1) {
    if (o.indexOf('condo') !== -1 || o.indexOf('solara') !== -1) {
      s += 2;
    }
  }
  return s;
}

function totalLinkScore(currentSlug, otherSlug) {
  return tokenOverlapScore(currentSlug, otherSlug) * 2 + contextualLinkScore(currentSlug, otherSlug);
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function buildInternalLinks(currentSlug, titleBySlug, allSlugs) {
  const others = allSlugs.filter(function (s) {
    return s !== currentSlug;
  });
  const picks = [];

  if (others.length === 0) {
    while (picks.length < 3) picks.push(null);
  } else {
    const scored = others.map(function (slug) {
      return { slug: slug, score: totalLinkScore(currentSlug, slug) };
    });
    scored.sort(function (x, y) {
      if (y.score !== x.score) return y.score - x.score;
      return x.slug.localeCompare(y.slug);
    });

    const maxScore = scored[0].score;
    let orderedSlugs;
    if (maxScore === 0) {
      orderedSlugs = shuffleArray(others);
    } else {
      orderedSlugs = scored.map(function (row) {
        return row.slug;
      });
    }

    for (let i = 0; i < orderedSlugs.length && picks.length < 3; i++) {
      picks.push(orderedSlugs[i]);
    }
    while (picks.length < 3) {
      picks.push(null);
    }
  }

  const lis = picks.slice(0, 3).map(function (slug) {
    if (slug === null) {
      return (
        '<li><a href="/index.html#analysis" class="text-brand-green underline decoration-brand-gold/60 underline-offset-4 transition hover:text-brand-gold">' +
        escapeHtml('Canmore ROI — Analysis') +
        '</a></li>'
      );
    }
    const title = titleBySlug[slug] || slug;
    return (
      '<li><a href="/analysis/' +
      escapeAttr(slug) +
      '.html" class="text-brand-green underline decoration-brand-gold/60 underline-offset-4 transition hover:text-brand-gold">' +
      escapeHtml(title) +
      '</a></li>'
    );
  });
  return (
    '<ul class="mt-6 space-y-3 text-sm font-medium">' + lis.join('\n') + '</ul>'
  );
}

function inject(html, data, meta) {
  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/, function () {
    return '<title>' + escapeHtml(meta.pageTitle) + '</title>';
  });
  out = out.replace(/<meta name="description" content="" \/>/, function () {
    return '<meta name="description" content="' + escapeAttr(meta.description) + '" />';
  });

  out = out.replace(/(<h1[^>]*\bdata-title\b[^>]*>)([\s\S]*?)(<\/h1>)/, function (_m, open, _mid, close) {
    return open + escapeHtml(data.title) + close;
  });

  out = out.replace(/(<p[^>]*\bdata-definition\b[^>]*>)([\s\S]*?)(<\/p>)/, function (_m, open, _mid, close) {
    return open + escapeHtml(data.definition) + close;
  });

  out = out.replace(/(<td[^>]*\bdata-revenue\b[^>]*>)([\s\S]*?)(<\/td>)/, function (_m, open, _mid, close) {
    return open + escapeHtml(formatCurrency(data.snapshot.monthly_revenue)) + close;
  });

  out = out.replace(/(<td[^>]*\bdata-costs\b[^>]*>)([\s\S]*?)(<\/td>)/, function (_m, open, _mid, close) {
    return open + escapeHtml(formatCurrency(data.snapshot.monthly_costs)) + close;
  });

  out = out.replace(
    /<td[^>]*\bdata-cashflow\b[^>]*><\/td>/,
    '<td class="' +
      cashflowClass(data.snapshot.cash_flow) +
      '" data-cashflow>' +
      escapeHtml(formatCurrency(data.snapshot.cash_flow)) +
      '</td>'
  );

  out = out.replace(/<div([^>]*\bdata-signal\b[^>]*)><\/div>/, function (_m, attrs) {
    return '<div' + attrs + '>' + escapeHtml(paybackLabel(data.payback_signal)) + '</div>';
  });

  out = out.replace(/(<ul[^>]*\bdata-reality\b[^>]*>)([\s\S]*?)(<\/ul>)/, function (_m, open, _mid, close) {
    return open + buildList(data.reality_check) + close;
  });

  out = out.replace(/(<ul[^>]*\bdata-good\b[^>]*>)([\s\S]*?)(<\/ul>)/, function (_m, open, _mid, close) {
    return open + buildList(data.verdict.good_for) + close;
  });

  out = out.replace(/(<ul[^>]*\bdata-bad\b[^>]*>)([\s\S]*?)(<\/ul>)/, function (_m, open, _mid, close) {
    return open + buildList(data.verdict.not_ideal_for) + close;
  });

  out = out.replace(/<div([^>]*\bdata-faq\b[^>]*)><\/div>/, function (_m, attrs) {
    return '<div' + attrs + '>' + buildFaqBlocks(data.faq) + '</div>';
  });

  out = out.replace(
    /<!--INTERNAL_LINKS-->[\s\S]*?<!--\/INTERNAL_LINKS-->/,
    '<!--INTERNAL_LINKS-->\n' + meta.internalLinksBlock + '\n<!--/INTERNAL_LINKS-->'
  );

  out = out.replace(
    /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"Article"[\s\S]*?\}\s*<\/script>/,
    function () {
      return (
        '<script type="application/ld+json">\n' +
        JSON.stringify(buildArticleLdJson(data), null, 2) +
        '\n  </script>'
      );
    }
  );

  const faqLd = buildFaqLdJson(data);
  if (faqLd) {
    out = out.replace(
      '</head>',
      '  <script type="application/ld+json">\n' +
        JSON.stringify(faqLd, null, 2) +
        '\n  </script>\n</head>'
    );
  }

  out = stripDataAttributes(out);

  return out;
}

function main() {
  const templateRaw = fs.readFileSync(TEMPLATE, 'utf8');
  const files = fs.readdirSync(DATA_DIR).filter(function (f) {
    return f.endsWith('.json') && !SKIP_FILES.has(f);
  });

  const datasets = [];
  files.forEach(function (f) {
    const full = path.join(DATA_DIR, f);
    const raw = fs.readFileSync(full, 'utf8');
    const data = JSON.parse(raw);
    if (data.slug !== path.basename(f, '.json')) {
      throw new Error('Slug mismatch in ' + f + ': expected ' + path.basename(f, '.json'));
    }
    datasets.push(data);
  });

  const allSlugs = datasets.map(function (d) {
    return d.slug;
  });
  const titleBySlug = {};
  datasets.forEach(function (d) {
    titleBySlug[d.slug] = d.title;
  });

  datasets.forEach(function (data) {
    const meta = {
      pageTitle: data.title + ' ROI Analysis — Cash Flow & Investment Breakdown',
      description:
        'See if ' +
        data.title +
        ' is a good investment. Monthly cash flow, costs, and STR performance breakdown.',
      internalLinksBlock: buildInternalLinks(data.slug, titleBySlug, allSlugs),
    };
    const html = inject(templateRaw, data, meta);
    const outPath = path.join(OUT_DIR, data.slug + '.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Wrote', path.relative(ROOT, outPath));
  });
}

main();
