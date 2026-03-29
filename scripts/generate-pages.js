#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'analysis', 'template.html');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'analysis');

const SKIP_FILES = new Set(['schema.json', 'example.json']);

const SITE_LAST_UPDATED_DISPLAY = 'March 28, 2026';
const DATA_CONSISTENCY_SENTENCE =
  'Across comparable models on this site, many stress-tests use roughly 55%–75% blended annual occupancy and public nightly rates near $250–$450 before platform fees and discounting; monthly net cash flow still varies sharply with leverage, HOA, and nights sold.';

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

function paybackTableLabel(signal) {
  const k = String(signal || '').toLowerCase();
  if (k === 'self-sustaining') return 'Self-sustaining';
  if (k === 'break-even') return 'Break-even';
  if (k === 'negative') return 'Negative carry';
  return 'Self-sustaining';
}

function paybackSnippetPhrase(signal) {
  const k = String(signal || '').toLowerCase();
  if (k === 'self-sustaining') {
    return 'positive monthly cash flow relative to this site’s break-even band';
  }
  if (k === 'break-even') {
    return 'roughly break-even monthly cash flow after the modeled cost bundle';
  }
  if (k === 'negative') {
    return 'negative monthly carry after the modeled cost bundle';
  }
  return 'modeled cash flow outcome per this site’s labels';
}

function buildShortAnswer(data) {
  if (data.short_answer && String(data.short_answer).trim()) {
    return String(data.short_answer).trim();
  }
  const rev = formatCurrency(data.snapshot.monthly_revenue);
  const costs = formatCurrency(data.snapshot.monthly_costs);
  const net = formatCurrency(data.snapshot.cash_flow);
  const phrase = paybackSnippetPhrase(data.payback_signal);
  return (
    'Modeled gross is about ' +
    rev +
    '/month, costs near ' +
    costs +
    ', net near ' +
    net +
    ' — ' +
    phrase +
    '. Most investors get this wrong by stopping at gross; numbers look good on paper, but this is where deals break in Canmore when strata and financing bite. Verify on the calculator.'
  );
}

function buildDirectAnswerBody(data) {
  if (data.short_answer && String(data.short_answer).trim()) {
    return String(data.short_answer).trim();
  }
  const rev = formatCurrency(data.snapshot.monthly_revenue);
  const costs = formatCurrency(data.snapshot.monthly_costs);
  const net = formatCurrency(data.snapshot.cash_flow);
  const phrase = paybackSnippetPhrase(data.payback_signal);
  return (
    'Modeled gross is about ' +
    rev +
    '/month, costs near ' +
    costs +
    ', net near ' +
    net +
    ' — ' +
    phrase +
    '.'
  );
}

function buildSerpTopBlock(data) {
  const snippet = escapeHtml(buildDirectAnswerBody(data));
  const titleEsc = escapeHtml(data.title);
  const consistency = escapeHtml(DATA_CONSISTENCY_SENTENCE);
  return (
    '<section class="border-t border-neutral-200/80 bg-white px-6 py-8 md:py-10" aria-label="Breadcrumb and direct answer">' +
    '<div class="mx-auto max-w-3xl">' +
    '<nav class="mb-6 text-sm text-neutral-600" aria-label="Breadcrumb">' +
    '<ol class="flex flex-wrap items-center gap-2">' +
    '<li><a href="../index.html" class="text-brand-green hover:underline">Home</a></li>' +
    '<li aria-hidden="true" class="text-neutral-400">/</li>' +
    '<li><a href="index.html" class="text-brand-green hover:underline">Analysis hub</a></li>' +
    '<li aria-hidden="true" class="text-neutral-400">/</li>' +
    '<li class="font-medium text-neutral-800" aria-current="page">' +
    titleEsc +
    '</li>' +
    '</ol></nav>' +
    '<div id="primary-answer" class="rounded-xl border border-brand-green/25 bg-brand-cream/50 p-5 shadow-sm">' +
    '<p class="text-base leading-relaxed text-neutral-800"><span class="font-semibold text-brand-green">Direct answer:</span> ' +
    snippet +
    '</p>' +
    '<p class="mt-3 text-xs leading-relaxed text-neutral-600">' +
    consistency +
    '</p></div></div></section>'
  );
}

function buildKeyTakeawaysHtml(data) {
  const net = formatCurrency(data.snapshot.cash_flow);
  const label = paybackTableLabel(data.payback_signal);
  const items = [
    'Modeled net cash flow is about ' +
      net +
      '/month on this page; payback label is «' +
      label +
      '». Self-Sustaining = property generates positive monthly cash flow. Break-even = property roughly covers costs. Negative Carry = property loses money monthly.',
    'Stress-tests on this site often use roughly 55%–75% blended occupancy and nightly rates near $250–$450 before discounting; move both on the calculator.',
    'Monthly net swings with HOA, insurance, financing, and nights sold — verify strata documents for the specific building.',
    'Read the knowledge hub, then similar property analyses, then the homepage calculator so assumptions stay in one loop.',
  ];
  return (
    '<section class="border-t border-neutral-200/80 bg-brand-cream px-6 py-10 md:py-12" aria-labelledby="takeaways-heading">' +
    '<div class="mx-auto max-w-3xl">' +
    '<h2 id="takeaways-heading" class="font-serif text-2xl font-semibold text-brand-green md:text-3xl">Key takeaways</h2>' +
    '<ul class="mt-6 list-disc space-y-3 pl-5 text-neutral-800 marker:text-brand-green">' +
    items
      .map(function (t) {
        return '<li class="text-sm leading-relaxed">' + escapeHtml(t) + '</li>';
      })
      .join('') +
    '</ul></div></section>'
  );
}

function buildExtraAnalysisFaqs(data) {
  return [
    {
      q: 'What occupancy range is realistic for Canmore STR?',
      a: 'Many comparable models on this site stress roughly 55%–75% blended annual occupancy; your asset may beat or miss that depending on quality, operations, and seasonality.',
    },
    {
      q: 'What nightly rate band is typical before discounting?',
      a: 'Public ADRs for 1–2BR resort-style product often land near $250–$450 before fees and discounting; premium peak nights exceed that.',
    },
    {
      q: 'How should Self-Sustaining, Break-even, and Negative Carry be read?',
      a: 'Self-Sustaining means the property generates positive monthly cash flow. Break-even means the property roughly covers costs. Negative Carry means the property loses money monthly after the modeled bundle.',
    },
  ];
}

function mergeAnalysisFaqs(data) {
  const base = (data.faq || []).slice();
  return base.concat(buildExtraAnalysisFaqs(data));
}

function buildSerpTableHtml(data) {
  let caption;
  let headers;
  let rows;
  const st = data.serp_table;
  if (st && st.headers && st.headers.length && st.rows && st.rows.length) {
    caption = st.caption || 'Key figures (illustrative)';
    headers = st.headers;
    rows = st.rows.map(function (r) {
      return r.map(function (cell) {
        return String(cell);
      });
    });
  } else {
    caption = 'Modeled monthly economics — ' + data.title + ' (illustrative, not a guarantee)';
    headers = ['Metric', 'Modeled amount'];
    rows = [
      ['Monthly STR gross (site model)', formatCurrency(data.snapshot.monthly_revenue)],
      ['Monthly costs (financing + operating bundle)', formatCurrency(data.snapshot.monthly_costs)],
      ['Net monthly cash flow', formatCurrency(data.snapshot.cash_flow)],
      ['Payback signal (this site)', paybackTableLabel(data.payback_signal)],
    ];
  }
  const ths = headers
    .map(function (h) {
      return (
        '<th scope="col" class="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-sm font-semibold text-brand-green">' +
        escapeHtml(h) +
        '</th>'
      );
    })
    .join('');
  const trs = rows
    .map(function (row) {
      const tds = row
        .map(function (cell) {
          return (
            '<td class="border-b border-neutral-100 px-3 py-2 text-sm text-neutral-700">' +
            escapeHtml(cell) +
            '</td>'
          );
        })
        .join('');
      return '<tr>' + tds + '</tr>';
    })
    .join('');
  return (
    '<section class="border-t border-neutral-200/80 bg-white px-6 py-10 md:py-12" aria-labelledby="serp-table-heading">' +
    '<div class="mx-auto max-w-3xl">' +
    '<h2 id="serp-table-heading" class="font-serif text-2xl font-semibold text-brand-green md:text-3xl">How do the headline numbers compare in one table?</h2>' +
    '<p class="mt-3 text-sm text-neutral-600">Google and AI systems often extract tables — use this as a quick sanity check, then read the narrative sections below.</p>' +
    '<div class="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">' +
    '<table class="min-w-full text-sm">' +
    '<caption class="border-b border-neutral-100 px-3 py-2 text-left text-xs font-medium text-neutral-600">' +
    escapeHtml(caption) +
    '</caption>' +
    '<thead><tr>' +
    ths +
    '</tr></thead><tbody>' +
    trs +
    '</tbody></table></div></div></section>'
  );
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

function buildArticleLdJson(data, meta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title + ' ROI (2026)',
    description: meta.description,
    dateModified: '2026-03-28',
    author: { '@type': 'Organization', name: 'CanmoreROI.com' },
    publisher: { '@type': 'Organization', name: 'CanmoreROI.com' },
  };
}

function buildFaqLdJson(data) {
  const items = mergeAnalysisFaqs(data).slice(0, 15);
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

function buildWebPageLd(data, meta) {
  const url = 'https://canmoreroi.com/analysis/' + data.slug + '.html';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': url + '#webpage',
    url: url,
    name: data.title + ' ROI (2026)',
    description: meta.description,
    isPartOf: { '@id': 'https://canmoreroi.com/#website' },
    publisher: { '@id': 'https://canmoreroi.com/#organization' },
  };
}

function buildBreadcrumbAnalysisLd(data) {
  const url = 'https://canmoreroi.com/analysis/' + data.slug + '.html';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://canmoreroi.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Analysis hub',
        item: 'https://canmoreroi.com/analysis/index.html',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.title,
        item: url,
      },
    ],
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

function buildKnowledgeContextBlock(slug) {
  const s = String(slug).toLowerCase();
  const A = 'font-medium text-brand-green underline decoration-brand-gold/60 underline-offset-4 hover:text-brand-gold';
  function ka(href, text) {
    return '<a href="' + href + '" class="' + A + '">' + escapeHtml(text) + '</a>';
  }
  const costs = ka('../knowledge/canmore-str-costs-breakdown.html', 'STR cost breakdown');
  const rental = ka('../knowledge/canmore-rental-income-reality.html', 'rental income reality');
  const occ = ka('../knowledge/canmore-occupancy-rates.html', 'occupancy reality');
  const risk = ka('../knowledge/canmore-condo-risk-guide.html', 'condo and strata risk');
  const mistakes = ka('../knowledge/canmore-investment-mistakes.html', 'investor mistakes (knowledge node)');
  const faqMaster = ka('../knowledge/canmore-roi-faq.html', 'Canmore ROI FAQ');
  const compareBb = ka('../compare/canmore-vs-banff-investment.html', 'Canmore vs Banff investment');
  const calc = ka('../index.html#analysis', 'calculator');
  let second;
  let third;
  if (s.indexOf('1m') !== -1) {
    second = mistakes;
    third = rental;
  } else if (
    /solara|lodges|mystic|spring|pektin|downtown|clearwater|legacy|canyon|harvie|banff|townhouse|duplex|studio|1br|2br|condo|silvertip/.test(s)
  ) {
    second = risk;
    third = occ;
  } else {
    second = rental;
    third = occ;
  }
  return (
    '<section class="border-t border-neutral-200/80 bg-white px-6 py-10 md:py-12" aria-labelledby="knowledge-context-heading">' +
    '<div class="mx-auto max-w-3xl">' +
    '<h2 id="knowledge-context-heading" class="font-serif text-xl font-semibold text-brand-green md:text-2xl">How this analysis maps to the knowledge base</h2>' +
    '<p class="mt-4 text-sm leading-relaxed text-neutral-700">Estimates are based on typical Canmore STR performance assumptions used across this site. Actual results vary. Many properties underperform modeled returns when occupancy slips or costs jump — read ' +
    costs +
    ', ' +
    second +
    ', and ' +
    third +
    ' for the same underwriting story, then stress inputs on the ' +
    calc +
    '. Loop: <a href="../guides/canmore-roi-explained.html" class="' +
    A +
    '">guides</a> → <a href="../knowledge/index.html" class="' +
    A +
    '">knowledge hub</a> → <a href="../analysis/index.html" class="' +
    A +
    '">property analyses</a> → ' +
    calc +
    '; see also ' +
    faqMaster +
    ' and ' +
    compareBb +
    '.</p></div></section>'
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
    return '<div' + attrs + '>' + buildFaqBlocks(mergeAnalysisFaqs(data)) + '</div>';
  });

  out = out.replace(
    /<!--INTERNAL_LINKS-->[\s\S]*?<!--\/INTERNAL_LINKS-->/,
    '<!--INTERNAL_LINKS-->\n' + meta.internalLinksBlock + '\n<!--/INTERNAL_LINKS-->'
  );

  out = out.replace(
    /<!--SERP_TOP_BLOCK-->[\s\S]*?<!--\/SERP_TOP_BLOCK-->/,
    '<!--SERP_TOP_BLOCK-->\n' + buildSerpTopBlock(data) + '\n<!--/SERP_TOP_BLOCK-->'
  );

  out = out.replace(
    /<!--SERP_TABLE_BLOCK-->[\s\S]*?<!--\/SERP_TABLE_BLOCK-->/,
    '<!--SERP_TABLE_BLOCK-->\n' + buildSerpTableHtml(data) + '\n<!--/SERP_TABLE_BLOCK-->'
  );

  out = out.replace(
    /<!--KNOWLEDGE_CONTEXT_BLOCK-->[\s\S]*?<!--\/KNOWLEDGE_CONTEXT_BLOCK-->/,
    '<!--KNOWLEDGE_CONTEXT_BLOCK-->\n' + buildKnowledgeContextBlock(data.slug) + '\n<!--/KNOWLEDGE_CONTEXT_BLOCK-->'
  );

  out = out.replace(
    /<!--KEY_TAKEAWAYS_BLOCK-->[\s\S]*?<!--\/KEY_TAKEAWAYS_BLOCK-->/,
    '<!--KEY_TAKEAWAYS_BLOCK-->\n' + buildKeyTakeawaysHtml(data) + '\n<!--/KEY_TAKEAWAYS_BLOCK-->'
  );

  out = out.replace(
    /<script type="application\/ld\+json" id="article-ld-json">[\s\S]*?<\/script>/,
    function () {
      return (
        '<script type="application/ld+json" id="article-ld-json">\n' +
        JSON.stringify(buildArticleLdJson(data, meta), null, 2) +
        '\n  </script>'
      );
    }
  );

  const faqLd = buildFaqLdJson(data);
  const webPageLd = buildWebPageLd(data, meta);
  const breadcrumbLd = buildBreadcrumbAnalysisLd(data);
  const headLdScripts = [];
  if (faqLd) headLdScripts.push(JSON.stringify(faqLd, null, 2));
  headLdScripts.push(JSON.stringify(webPageLd, null, 2));
  headLdScripts.push(JSON.stringify(breadcrumbLd, null, 2));
  const headLdBlock =
    headLdScripts
      .map(function (json) {
        return '  <script type="application/ld+json">\n' + json + '\n  </script>';
      })
      .join('\n') + '\n';
  out = out.replace('</head>', headLdBlock + '</head>');

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
      pageTitle: data.title + ' ROI (2026) — Real Numbers, Not Estimates | Canmore ROI',
      description:
        'See modeled ' +
        data.title +
        ' STR cash flow, revenue, and costs. Most properties do not perform as expected on paper — verify before you buy.',
      internalLinksBlock: buildInternalLinks(data.slug, titleBySlug, allSlugs),
    };
    const html = inject(templateRaw, data, meta);
    const outPath = path.join(OUT_DIR, data.slug + '.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Wrote', path.relative(ROOT, outPath));
  });
}

main();
