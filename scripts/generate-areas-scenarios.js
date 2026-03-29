#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://canmoreroi.com';

const DATA_CONSISTENCY_SENTENCE =
  'Across comparable models on this site, many stress-tests use roughly 55%–75% blended annual occupancy and public nightly rates near $250–$450 before platform fees and discounting; monthly net cash flow still varies sharply with leverage, HOA, and nights sold.';

const A_CLS =
  'font-medium text-brand-green underline decoration-brand-gold/60 underline-offset-4 hover:text-brand-gold';

const ENTITY = `  <script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","@id":"${BASE}/#organization","name":"CanmoreROI.com","url":"${BASE}/","description":"Canmore STR investment analysis system and Bow Valley short-term rental viability data engine — analyses, calculator, guides, scenarios, knowledge nodes.","parentOrganization":{"@type":"Organization","name":"Albor Digital LLC"}},
    {"@type":"WebSite","@id":"${BASE}/#website","url":"${BASE}/","name":"Canmore ROI","publisher":{"@id":"${BASE}/#organization"},"inLanguage":"en-CA"}
  ]}
  </script>`;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mergeGlobalFaq(faq) {
  const base = (faq || []).slice();
  const add = [
    {
      q: 'What blended occupancy band does CanmoreROI stress in many models?',
      a: 'Roughly 55%–75% annual occupancy before discounting is a common stress band on this site; peak-heavy calendars can beat it and soft calendars can miss it.',
    },
    {
      q: 'What nightly rate band is common before fees and discounting?',
      a: 'Many 1–2BR resort-style listings show public ADRs near $250–$450 before platform fees and discounting; premium peak nights exceed that.',
    },
  ];
  return base.concat(add);
}

function head(opts) {
  const faqForLd = mergeGlobalFaq(opts.faq || []);
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqForLd.map(function (f) {
      return {
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      };
    }),
  };
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': opts.url + '#webpage',
    url: opts.url,
    name: opts.schemaName || opts.pageTitle.replace(/\s*\|\s*Canmore ROI\s*$/, ''),
    description: opts.description,
    isPartOf: { '@id': BASE + '/#website' },
    publisher: { '@id': BASE + '/#organization' },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: opts.breadcrumb.map(function (b, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.item,
      };
    }),
  };
  return (
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${esc(opts.description)}" />
  <title>${esc(opts.pageTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { brand: { green: '#1F3D2B', cream: '#F7F5F2', gold: '#C8A96A' } }, fontFamily: { serif: ['"Playfair Display"', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] } } } };
  </script>
${ENTITY}
  <script type="application/ld+json">${JSON.stringify(webPage)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbs)}</script>
</head>`
  );
}

function footer() {
  return `<footer class="mt-20 bg-[#1F3D2B] text-white">
    <div class="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
      <div>
        <h3 class="font-serif text-xl text-white">Canmore ROI</h3>
        <p class="mt-2 text-sm text-gray-300">Real numbers behind Canmore property investments.</p>
        <p class="mt-3 text-xs text-gray-400"><a href="mailto:contact@canmoreroi.com" class="hover:text-white">contact@canmoreroi.com</a></p>
      </div>
      <div>
        <p class="mb-3 font-semibold">Navigation</p>
        <ul class="space-y-2 text-sm text-gray-300">
          <li><a href="../index.html" class="hover:text-white">Home</a></li>
          <li><a href="../index.html#analysis" class="hover:text-white">Analysis</a></li>
          <li><a href="../index.html#areas-programmatic" class="hover:text-white">Areas</a></li>
          <li><a href="../index.html#scenarios-programmatic" class="hover:text-white">Scenarios</a></li>
          <li><a href="../analysis/index.html" class="hover:text-white">Property analyses</a></li>
          <li><a href="../knowledge/index.html" class="hover:text-white">Knowledge</a></li>
        </ul>
      </div>
      <div>
        <p class="mb-3 font-semibold">Legal</p>
        <ul class="space-y-2 text-sm text-gray-300">
          <li><a href="../legal/terms.html" class="hover:text-white">Terms</a></li>
          <li><a href="../legal/privacy.html" class="hover:text-white">Privacy</a></li>
          <li><a href="../legal/disclaimer.html" class="hover:text-white">Disclaimer</a></li>
          <li><a href="../legal/cookies.html" class="hover:text-white">Cookies</a></li>
        </ul>
      </div>
      <div>
        <p class="mb-3 font-semibold">Get Updates</p>
        <form class="space-y-2" action="#" method="get" onsubmit="return false;">
          <label class="sr-only" for="footer-em">Email</label>
          <input id="footer-em" type="email" placeholder="Email" class="mb-2 w-full rounded px-3 py-2 text-black" autocomplete="email" />
          <button type="button" class="w-full rounded bg-[#C8A96A] px-4 py-2 text-black" title="Coming soon">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="pb-6 text-center text-xs text-gray-400">© 2026 CanmoreROI.com — Operated by Albor Digital LLC · Last updated: March 28, 2026</div>
  </footer>`;
}

function header() {
  return `<header class="border-b border-neutral-200 bg-white">
    <nav class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5" aria-label="Primary">
      <a href="../index.html" class="font-serif text-xl font-semibold text-brand-green">Canmore ROI</a>
      <ul class="flex flex-wrap gap-6 text-sm font-medium text-brand-green">
        <li><a href="../index.html#analysis" class="hover:text-brand-gold">Analysis</a></li>
        <li><a href="../index.html#areas-programmatic" class="hover:text-brand-gold">Areas</a></li>
        <li><a href="../index.html#scenarios-programmatic" class="hover:text-brand-gold">Scenarios</a></li>
        <li><a href="../index.html#guides" class="hover:text-brand-gold">Guides</a></li>
        <li><a href="../analysis/index.html" class="hover:text-brand-gold">Property analyses</a></li>
        <li><a href="../knowledge/index.html" class="hover:text-brand-gold">Knowledge</a></li>
        <li><a href="../knowledge/canmore-roi-faq.html" class="hover:text-brand-gold">ROI FAQ</a></li>
        <li><a href="../compare/canmore-vs-banff-investment.html" class="hover:text-brand-gold">vs Banff</a></li>
      </ul>
    </nav>
  </header>`;
}

function breadcrumbsHtml(items) {
  const lis = items
    .map(function (it, i) {
      const isLast = i === items.length - 1;
      if (isLast) {
        return `<li class="font-medium text-neutral-800" aria-current="page">${esc(it.label)}</li>`;
      }
      return `<li><a href="${it.href}" class="text-brand-green hover:underline">${esc(it.label)}</a></li><li aria-hidden="true" class="text-neutral-400">/</li>`;
    })
    .join('');
  return `<nav class="mb-6 text-sm text-neutral-600" aria-label="Breadcrumb"><ol class="flex flex-wrap items-center gap-2">${lis}</ol></nav>`;
}

function primaryAnswerBlock(shortAnswerPlain) {
  return `<div id="primary-answer" class="mt-4 rounded-xl border border-brand-green/25 bg-white p-5 shadow-sm"><p class="text-base leading-relaxed text-neutral-800"><span class="font-semibold text-brand-green">Direct answer:</span> ${esc(shortAnswerPlain)}</p><p class="mt-3 text-xs leading-relaxed text-neutral-600">${esc(DATA_CONSISTENCY_SENTENCE)}</p></div>`;
}

function takeawaysSection(items, idSuffix) {
  const lis = items
    .map(function (t) {
      return `<li class="text-sm leading-relaxed text-neutral-800">${esc(t)}</li>`;
    })
    .join('');
  return `<section class="mt-12 rounded-xl border border-brand-green/25 bg-brand-cream/50 p-6 shadow-sm" aria-labelledby="takeaways-${idSuffix}"><h2 id="takeaways-${idSuffix}" class="font-serif text-xl font-semibold text-brand-green">Key takeaways</h2><ul class="mt-4 list-disc space-y-2 pl-5 marker:text-brand-green">${lis}</ul></section>`;
}

function defaultTakeawaysForArea(a) {
  const parts = a.shortAnswer.split('.');
  const lead = parts.slice(0, 2).join('.').trim() + '.';
  const first =
    lead.length >= 50 ? lead : a.shortAnswer.slice(0, Math.min(320, a.shortAnswer.length)) + (a.shortAnswer.length > 320 ? '…' : '');
  return [
    first,
    'Self-Sustaining = property generates positive monthly cash flow. Break-even = property roughly covers costs. Negative Carry = property loses money monthly.',
    'Comparable stress bands on this site often use roughly 55%–75% blended occupancy and nightly rates near $250–$450 before discounting.',
    'Net cash flow is volatile month to month — verify strata, insurance, and financing on each deal.',
    'Loop: guides → knowledge hub → property analyses → homepage calculator; see ROI FAQ and Canmore vs Banff for high-intent queries.',
  ];
}

function defaultTakeawaysForScenario(s) {
  return defaultTakeawaysForArea(s);
}

function renderTable(t) {
  const ths = t.headers.map(function (h) {
    return `<th scope="col" class="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left font-semibold text-brand-green">${esc(h)}</th>`;
  });
  const trs = t.rows
    .map(function (row) {
      const tds = row
        .map(function (cell) {
          return `<td class="border-b border-neutral-100 px-3 py-2 text-neutral-700">${esc(cell)}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  return `<div class="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm"><table class="min-w-full text-sm"><caption class="border-b border-neutral-100 px-3 py-2 text-left text-xs font-medium text-neutral-600">${esc(t.caption)}</caption><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function renderSections(sections) {
  return sections
    .map(function (s, i) {
      const paras = s.paragraphs
        .map(function (p) {
          return `<p class="mt-4 max-w-prose leading-relaxed text-neutral-800">${p}</p>`;
        })
        .join('');
      const table = s.table ? renderTable(s.table) : '';
      return `<section class="mt-10" aria-labelledby="sec-${i}"><h2 id="sec-${i}" class="font-serif text-xl font-semibold text-brand-green">${esc(s.h)}</h2>${paras}${table}</section>`;
    })
    .join('');
}

function relatedTwoParagraphs(p1, p2) {
  return `<div class="mt-10 space-y-3 text-sm leading-relaxed text-neutral-700"><p>${p1}</p><p>${p2}</p></div>`;
}

const areas = [
  {
    file: 'downtown-canmore.html',
    pageTitle: 'Downtown Canmore STR ROI (2026) — Real Numbers, Not List Hype | Canmore ROI',
    schemaName: 'Downtown Canmore STR ROI (2026)',
    description:
      'See real Canmore STR returns, fee load, and cash flow scenarios for downtown. Most properties do not perform as expected on paper — verify before you buy.',
    url: BASE + '/areas/downtown-canmore.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Areas', item: BASE + '/index.html#areas-programmatic' },
      { name: 'Downtown Canmore', item: BASE + '/areas/downtown-canmore.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#areas-programmatic', label: 'Areas' },
      { label: 'Downtown Canmore' },
    ],
    h1: 'Downtown Canmore',
    shortAnswer:
      'Downtown Canmore STR often wins on nightly rate and walk-to-amenity demand, but net cash flow still hinges on purchase price and HOA. Most properties do not clear financing plus fees unless occupancy stays strong and costs stay tight — numbers look good on paper, but fees erase thin margins fast.',
    table: {
      caption: 'Downtown vs peripheral STR — illustrative comparison (not a guarantee)',
      headers: ['Factor', 'Downtown', 'Peripheral / village'],
      rows: [
        ['Typical ADR pressure', 'Higher guest willingness to pay', 'Often lower; competes on price'],
        ['Acquisition basis', 'Usually higher $/sq ft', 'Wide range; can be lower'],
        ['HOA + fee risk', 'Elevated in amenity-heavy stratas', 'Varies; still verify reserves'],
        ['Net cash flow', 'Not automatic despite gross', 'Can win on basis if fees are tame'],
      ],
    },
    sections: [
      {
        h: 'Is downtown Canmore a good STR investment?',
        paragraphs: [
          `Yes for <strong>gross demand</strong> more often than not — not automatically for <strong>net monthly cash flow</strong>. Guests pay for walkability and Main Street access; owners pay for higher basis and competitive supply within blocks.`,
          `Most investors get this wrong by equating “busy street” with “safe yield.” This is where deals break in Canmore: the <a href="../analysis/downtown-canmore-condo.html" class="${A_CLS}">downtown condo analysis</a> shows how modeled gross can still miss mortgage plus HOA.`,
        ],
      },
      {
        h: 'What price range is typical for downtown Canmore condos?',
        paragraphs: [
          `Compact STR-capable condos commonly land from the <strong>high $400s into $900K+</strong> CAD depending on bed count, parking, and finish (market snapshots move by building). Townhomes and small multifamily step higher.`,
          `Use list price as a starting line only. Numbers look good on paper, but trailing insurance jumps and special levies are where underwriting dies — not in the brochure photos.`,
        ],
      },
      {
        h: 'How much income can a downtown Canmore Airbnb generate?',
        paragraphs: [
          `Modeled <strong>gross</strong> for well-run 1–2BR product often sits roughly <strong>$5,500–$9,500/month</strong> when occupancy holds mid-50s to mid-60s at strong ADR — <em>before</em> financing, management, and full OpEx.`,
          `Net swings hardest on HOA, interest rate, and whether shoulder months hold. Cross-check assumptions with <a href="../analysis/spring-creek-meadows-2br.html" class="${A_CLS}">Spring Creek Meadows 2BR</a> for a second downtown-adjacent data point.`,
        ],
      },
      {
        h: 'What are the biggest risks of buying downtown?',
        paragraphs: [
          `Higher basis, noise and parking complaints that cap nights, bylaw scrutiny, and ADR volatility when supply spikes the same two shoulder weeks. This is where deals break when owners assumed “location premium” equals “margin premium.”`,
        ],
      },
      {
        h: 'Who is downtown Canmore for?',
        paragraphs: [
          `Operators who want rate and can manage tight margins — not “set-and-forget” yield buyers. If you need education on realistic nights booked, read <a href="../guides/occupancy-rates-canmore.html" class="${A_CLS}">occupancy rates in Canmore</a> before you offer.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is Canmore Airbnb profitable downtown?',
        a: 'Sometimes on gross, not always on net — purchase price, HOA, financing, and occupancy decide whether monthly cash flow is positive.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Often yes relative to Canadian norms; always read strata docs, depreciation reports, and insurance history before trusting a pro forma.',
      },
      {
        q: 'Is downtown better for STR than the edges?',
        a: 'Often on rate and occupancy, but not automatically on net — purchase price and HOA fees decide cash flow.',
      },
      {
        q: 'What should I verify before buying downtown?',
        a: 'Strata rental bylaws, insurance history, parking assignments, and utility spikes — not just gross on Airbnb comps.',
      },
    ],
    related: {
      p1: `Scenario context: see <a href="../scenarios/canmore-break-even-investment.html" class="${A_CLS}">break-even STR investment</a> — thin downtown margins often live in that band.`,
      p2: `Stress revenue on the <a href="../index.html#analysis" class="${A_CLS}">homepage calculator</a> before you trust any listing deck.`,
    },
  },
  {
    file: 'silvertip-canmore.html',
    pageTitle: 'Silvertip Canmore STR ROI (2026) — Luxury Gross vs Real Net | Canmore ROI',
    schemaName: 'Silvertip Canmore STR ROI (2026)',
    description:
      'See Silvertip luxury STR economics, fee load, and cash flow reality. Most properties do not perform as expected once debt and operations bite — verify before you buy.',
    url: BASE + '/areas/silvertip-canmore.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Areas', item: BASE + '/index.html#areas-programmatic' },
      { name: 'Silvertip', item: BASE + '/areas/silvertip-canmore.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#areas-programmatic', label: 'Areas' },
      { label: 'Silvertip' },
    ],
    h1: 'Silvertip (Canmore)',
    shortAnswer:
      'Silvertip skews luxury: peak-week gross can look huge, but debt service, snow ops, utilities, and turnover often drag net toward break-even or negative carry. Most investors get this wrong by annualizing peak ADR — this is where deals break when the calendar has normal shoulder months.',
    table: {
      caption: 'Luxury STR economics — common pressure points',
      headers: ['Line item', 'Why it matters in Silvertip'],
      rows: [
        ['Debt service', 'Large loan on a high basis dominates monthly outflows'],
        ['Snow + maintenance', 'Weather-driven spend exceeds typical condo reserves'],
        ['Cleaning + linen', 'High turnover on large homes scales cost fast'],
        ['Insurance + utilities', 'Estate-style homes carry wider variance than a 1BR condo'],
      ],
    },
    sections: [
      {
        h: 'Is Silvertip Canmore a good investment for STR?',
        paragraphs: [
          `It can be — as <strong>premium product</strong> with real operating discipline — but it is not a safe “high gross = high net” story. Numbers look good on paper when owners model Christmas week and ignore April.`,
          `Read the <a href="../analysis/silvertip-luxury-chalet.html" class="${A_CLS}">Silvertip luxury chalet analysis</a> for one modeled path where monthly carry still goes negative under typical financing.`,
        ],
      },
      {
        h: 'What do Silvertip homes usually cost?',
        paragraphs: [
          `Single-family and estate-style homes frequently clear <strong>$1.5M–$3M+</strong> depending on size and view; attached luxury can sit lower but still carries premium operating load.`,
        ],
      },
      {
        h: 'How much can a luxury Canmore Airbnb make?',
        paragraphs: [
          `Peak months can show <strong>$12,000–$18,000+ gross</strong> on large homes — annual blends depend on booking lead times, cleaning load, and discounting in soft weeks.`,
          `Pair that story with <a href="../guides/str-income-canmore.html" class="${A_CLS}">STR income in Canmore</a> so you separate gross bookings from cash you keep.`,
        ],
      },
      {
        h: 'What are the risks of investing in Silvertip?',
        paragraphs: [
          `Operating complexity, insurance and utility volatility, and a thinner resale pool if STR rules or buyer taste shifts. This is where deals break when reserves were sized for a condo, not a 4,000 sq ft home.`,
        ],
      },
      {
        h: 'Who should buy in Silvertip?',
        paragraphs: [
          `Lifestyle-plus-STR owners or professional managers with scale — not thin-reserve first-time landlords. Compare lodge-style product via <a href="../analysis/lodges-at-canmore-2br.html" class="${A_CLS}">Lodges at Canmore 2BR</a> for a different fee footprint.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is Canmore Airbnb profitable in Silvertip?',
        a: 'Gross can be strong; net is often squeezed by financing and operating spend — verify with building-specific costs and conservative occupancy.',
      },
      {
        q: 'Can Silvertip lose money monthly despite high gross?',
        a: 'Yes — financing and operating spend can exceed even strong gross bookings.',
      },
      {
        q: 'What is the biggest underwriting mistake?',
        a: 'Using peak-week revenue as a year-round baseline instead of blended occupancy.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Strata fees and insurance are material across Canmore; luxury homes add different fixed costs — neither should be hand-waved.',
      },
    ],
    related: {
      p1: `Dollar-band context: the <a href="../scenarios/canmore-1m-investment.html" class="${A_CLS}">$1M Canmore investment scenario</a> explains why basis still dominates at high price tags.`,
      p2: `Sanity-check nights booked using <a href="../guides/occupancy-rates-canmore.html" class="${A_CLS}">occupancy benchmarks</a> — not peak-calendar screenshots.`,
    },
  },
  {
    file: 'three-sisters-canmore.html',
    pageTitle: 'Three Sisters Canmore STR (2026) — Village Yields, Real Costs | Canmore ROI',
    schemaName: 'Three Sisters Canmore STR (2026)',
    description:
      'See Three Sisters STR economics, pricing bands, and cash flow context. Most properties do not perform as expected when every neighbor competes the same week — verify before you buy.',
    url: BASE + '/areas/three-sisters-canmore.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Areas', item: BASE + '/index.html#areas-programmatic' },
      { name: 'Three Sisters', item: BASE + '/areas/three-sisters-canmore.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#areas-programmatic', label: 'Areas' },
      { label: 'Three Sisters Village' },
    ],
    h1: 'Three Sisters Village',
    shortAnswer:
      'Three Sisters bundles trails and village amenities that support STR demand, but intra-area competition can compress ADR. Most investors get this wrong by assuming village charm equals pricing power — this is where deals break when every unit fights the same shoulder weeks.',
    table: {
      caption: 'Three Sisters vs downtown — quick lens (illustrative)',
      headers: ['Lens', 'Three Sisters', 'Downtown'],
      rows: [
        ['Guest profile', 'Families, repeat weekenders', 'Walk-to-dining, shorter stays'],
        ['ADR (typical)', 'Often slightly below premium downtown', 'Higher on average'],
        ['Competition density', 'Many similar units in-phase', 'Blocks of competing condos'],
        ['Fee variability', 'Material by phase and vintage', 'Often high-amenity stratas'],
      ],
    },
    sections: [
      {
        h: 'Is Three Sisters Village good for Canmore STR?',
        paragraphs: [
          `Demand is <strong>real</strong> — so is <strong>competition</strong>. Similar bed counts in the same pocket can race on price during soft windows.`,
          `Start from the <a href="../analysis/three-sisters-village-condo.html" class="${A_CLS}">Three Sisters Village condo analysis</a> and compare basis against a <a href="../analysis/canmore-townhouse-str.html" class="${A_CLS}">townhouse STR model</a> for adjacent product types.`,
        ],
      },
      {
        h: 'What are typical Three Sisters purchase prices?',
        paragraphs: [
          `Condos and townhomes often cluster <strong>$500s–$900K+</strong> for larger or newer product; fees vary materially by phase — pull 24 months of strata minutes before you trust a seller deck.`,
        ],
      },
      {
        h: 'How much income can a Three Sisters Airbnb generate?',
        paragraphs: [
          `Modeled monthly <strong>gross</strong> for 2BR product often lands near <strong>$5,200–$7,200</strong> with disciplined calendar management — not peak-week screenshots annualized.`,
        ],
      },
      {
        h: 'What are the risks of investing in Three Sisters?',
        paragraphs: [
          `Pricing wars in shoulder weeks, fee surprises by phase, and ADR pressure when supply spikes. Numbers look good on paper until three neighbors discount the same month — this is where deals break.`,
        ],
      },
      {
        h: 'Who should buy in Three Sisters instead of downtown?',
        paragraphs: [
          `Investors who accept slightly lower ADR for operational rhythm and family stays — less ideal if you need maximum walk score for every booking. Learn failure modes in <a href="../guides/canmore-investment-mistakes.html" class="${A_CLS}">Canmore investment mistakes</a>.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is Canmore Airbnb profitable in Three Sisters?',
        a: 'It can be — net depends on basis, fees, occupancy, and how often you have to discount to fill shoulder weeks.',
      },
      {
        q: 'Is Three Sisters or downtown better for STR?',
        a: 'Downtown often wins on rate; Three Sisters can win on basis and family stays — net depends on your specific deal.',
      },
      {
        q: 'What analysis matches this pocket?',
        a: 'See the Three Sisters Village condo model on CanmoreROI.com.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Yes in many buildings — compare strata docs and reserve funding across phases, not just monthly posted fees.',
      },
    ],
    related: {
      p1: `Budget band: the <a href="../scenarios/canmore-500k-investment.html" class="${A_CLS}">$500K Canmore investment scenario</a> mirrors many village entry condos.`,
      p2: `Run your nights and rate on the <a href="../index.html#analysis" class="${A_CLS}">calculator</a> with conservative occupancy.`,
    },
  },
  {
    file: 'canmore-short-term-zones.html',
    pageTitle: 'Canmore STR Zones (2026) — Rules, ROI Reality | Canmore ROI',
    schemaName: 'Canmore STR Zones (2026)',
    description:
      'See how short-term rental zoning and bylaws intersect with Canmore ROI. Most properties do not perform as expected if STR permission is uncertain — verify before you buy.',
    url: BASE + '/areas/canmore-short-term-zones.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Areas', item: BASE + '/index.html#areas-programmatic' },
      { name: 'STR zones', item: BASE + '/areas/canmore-short-term-zones.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#areas-programmatic', label: 'Areas' },
      { label: 'STR zones' },
    ],
    h1: 'Short-term rental zones (Canmore)',
    shortAnswer:
      'STR permission in Canmore stacks municipal rules, land use, and strata bylaws — uncertainty is not a rounding error. If STR revenue must be zero in a stress case, most pro formas collapse; this is where deals break overnight when enforcement or insurance catches up.',
    table: {
      caption: 'What to verify before modeling STR revenue (checklist)',
      headers: ['Check', 'Why it changes ROI'],
      rows: [
        ['Municipal licensing / rules', 'Operating legality and enforcement risk'],
        ['Strata rental bylaws', 'Can ban or cap STR regardless of town rules'],
        ['Insurance binder language', 'STR exclusions can void assumed gross'],
        ['Long-term rent fallback', 'If STR tightens, does the deal still breathe?'],
      ],
    },
    sections: [
      {
        h: 'Can you run an Airbnb legally in every Canmore condo?',
        paragraphs: [
          `<strong>No.</strong> Strata bylaws and municipal requirements can conflict with what a listing implies. Most investors get this wrong by asking only the listing agent.`,
          `After rules are clear, model cash flow using <a href="../analysis/downtown-canmore-condo.html" class="${A_CLS}">downtown condo</a> and <a href="../analysis/solara-canmore-2br.html" class="${A_CLS}">Solara 2BR</a> as product anchors.`,
        ],
      },
      {
        h: 'What happens to ROI if STR rules tighten?',
        paragraphs: [
          `Revenue models can collapse — always run a <strong>long-term rental fallback</strong> and insurance stress. This is where deals break in Canmore when buyers assumed “everyone does it.”`,
        ],
      },
      {
        h: 'How much income is realistic if STR is clearly allowed?',
        paragraphs: [
          `Where STR is permitted and professionally operated, modeled gross for 1–2BR often tracks roughly <strong>$4,200–$9,000/month</strong> depending on quality and calendar — net still depends on fees and financing.`,
        ],
      },
      {
        h: 'What are the risks of ignoring zoning and bylaws?',
        paragraphs: [
          `Fines, forced cessation, insurance denial, and lender issues. Numbers look good on paper until legal STR status disappears — verify with counsel and the corporation, not forums.`,
        ],
      },
      {
        h: 'Where should I learn the cash-flow mechanics?',
        paragraphs: [
          `Read <a href="../guides/canmore-roi-explained.html" class="${A_CLS}">Canmore ROI explained</a> for how monthly net is framed on this site, then stress downside in <a href="../scenarios/canmore-negative-cash-flow.html" class="${A_CLS}">negative cash flow scenario</a>.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is this page legal advice?',
        a: 'No — confirm STR eligibility with qualified counsel, the municipality, and your strata corporation.',
      },
      {
        q: 'Is Canmore Airbnb profitable if rules are uncertain?',
        a: 'Do not model uncertain STR as certain revenue — treat ambiguity as binary risk to net cash flow.',
      },
      {
        q: 'What happens if STR rules tighten?',
        a: 'Revenue models can collapse; always run a long-term rental fallback scenario.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Often yes — and legal STR buildings can still carry heavy HOA and insurance lines.',
      },
    ],
    related: {
      p1: `After zoning homework, open <a href="../analysis/index.html" class="${A_CLS}">all property analyses</a> for modeled examples.`,
      p2: `Use the <a href="../index.html#analysis" class="${A_CLS}">calculator</a> with conservative occupancy once revenue is defensible.`,
    },
  },
];

const scenarios = [
  {
    file: 'canmore-500k-investment.html',
    pageTitle: '$500K Canmore Investment (2026) — Cash Flow Reality | Canmore ROI',
    schemaName: '$500K Canmore Investment (2026)',
    description:
      'See what ~$500K buys in Canmore STR economics: leverage, fees, and realistic monthly outcomes. Most properties do not perform as expected at thin gross — verify before you buy.',
    url: BASE + '/scenarios/canmore-500k-investment.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Scenarios', item: BASE + '/index.html#scenarios-programmatic' },
      { name: '$500K scenario', item: BASE + '/scenarios/canmore-500k-investment.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#scenarios-programmatic', label: 'Scenarios' },
      { label: '$500K investment' },
    ],
    h1: '$500K Canmore investment',
    shortAnswer:
      'At ~$500K you usually buy smaller or peripheral STR product where fixed HOA and financing eat a large share of gross. Most investors get this wrong by assuming lower price equals safer cash flow — this is where deals break when occupancy slips even a few points.',
    table: {
      caption: 'Illustrative assumption band (verify every deal)',
      headers: ['Input', 'Typical modeled range'],
      rows: [
        ['Down payment', 'Roughly 20–25%'],
        ['Nightly rate (1BR-ish)', '$240–$310'],
        ['Annual occupancy (blend)', 'Mid-50% to low-60%'],
        ['Condo fees', '$350–$550/month (building-dependent)'],
      ],
    },
    sections: [
      {
        h: 'What does a $500K Canmore investment usually mean?',
        paragraphs: [
          `You are usually in <strong>compact condo</strong> or <strong>peripheral townhome</strong> territory — gross STR can work, but fixed fees consume a larger share of revenue than at higher tiers.`,
        ],
      },
      {
        h: 'What outcomes are realistic on monthly cash flow?',
        paragraphs: [
          `Many defensible combinations land <strong>break-even to modestly positive</strong> ($0–$400/month); aggressive leverage or fee surprises flip negative fast.`,
          `Compare two smaller-footprint models: <a href="../analysis/legacy-trail-1br.html" class="${A_CLS}">Legacy Trail 1BR</a> and <a href="../analysis/clearwater-canmore-1br.html" class="${A_CLS}">Clearwater 1BR</a>.`,
        ],
      },
      {
        h: 'What is the reality check most buyers skip?',
        paragraphs: [
          `Special assessments and insurance resets hit small-unit economics hardest in <strong>percentage</strong> terms. Numbers look good on paper, but one levy erases a year of “yield.”`,
        ],
      },
      {
        h: 'Who is this price band for?',
        paragraphs: [
          `Hands-on operators and buyers with supplemental income — not maximum-leverage yield chasers. Read <a href="../guides/occupancy-rates-canmore.html" class="${A_CLS}">realistic occupancy</a> before you trust seller projections.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is $500K enough for positive STR cash flow in Canmore?',
        a: 'Sometimes — usually thin; verify fees, financing, and occupancy with conservative inputs.',
      },
      {
        q: 'Is Canmore Airbnb profitable at this price?',
        a: 'Possible on gross; net often hinges on occupancy stability and fee trajectory.',
      },
      {
        q: 'What are the risks of investing in Canmore at $500K?',
        a: 'Underestimating fixed costs relative to gross revenue and overestimating shoulder-season occupancy.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Often yes — fee lines and insurance spikes are decisive at this basis.',
      },
    ],
    related: {
      p1: `Adjacent scenario: <a href="../scenarios/canmore-break-even-investment.html" class="${A_CLS}">break-even STR investment</a> — many $500K profiles live there.`,
      p2: `Stress your inputs on the <a href="../index.html#analysis" class="${A_CLS}">calculator</a>.`,
    },
  },
  {
    file: 'canmore-1m-investment.html',
    pageTitle: '$1M Canmore Investment (2026) — Why Cash Flow Breaks | Canmore ROI',
    schemaName: '$1M Canmore Investment (2026)',
    description:
      'See real $1M Canmore STR returns, debt service, and fee math. Most properties do not perform as expected once financing scales — verify before you buy.',
    url: BASE + '/scenarios/canmore-1m-investment.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Scenarios', item: BASE + '/index.html#scenarios-programmatic' },
      { name: '$1M scenario', item: BASE + '/scenarios/canmore-1m-investment.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#scenarios-programmatic', label: 'Scenarios' },
      { label: '$1M investment' },
    ],
    h1: '$1M Canmore investment',
    shortAnswer:
      '$1M buys strong Canmore STR demand — but debt service scales linearly while gross does not. Most investors get this wrong by mixing appreciation with monthly solvency; published $1M models here often show negative carry unless basis, LTV, or occupancy are exceptional.',
    table: {
      caption: '$1M STR — why monthly net often disappoints',
      headers: ['Driver', 'Effect on net'],
      rows: [
        ['Higher loan balance', 'Fixed payment dominates when rates move'],
        ['HOA + insurance', 'Large absolute dollars even if “normal” for class'],
        ['Blended occupancy', 'Small miss × high fixed costs = red months'],
        ['ADR competition', 'Discounting fills nights but erodes gross'],
      ],
    },
    sections: [
      {
        h: 'Is a $1M Canmore investment cash-flow positive?',
        paragraphs: [
          `<strong>Often no</strong> under STR financing and typical fee loads — our <a href="../analysis/canmore-1m-investment.html" class="${A_CLS}">$1M property analysis</a> shows negative monthly carry in a modeled baseline.`,
        ],
      },
      {
        h: 'What assumptions move the outcome?',
        paragraphs: [
          `20–25% down, rate-sensitive mortgage payment, fees <strong>$500–$800+/month</strong>, modeled gross often <strong>$6,500–$8,500/month</strong> at blended occupancy — illustrative only.`,
        ],
      },
      {
        h: 'What is the reality check on wealth vs cash?',
        paragraphs: [
          `Appreciation and principal paydown are not monthly cash. This is where deals break emotionally: the asset can still be “good” while bleeding every month.`,
        ],
      },
      {
        h: 'Who should still buy at $1M?',
        paragraphs: [
          `Lower LTV buyers, lifestyle-heavy owners, or long horizons — not income-dependent distributions. Pair with <a href="../analysis/spring-creek-meadows-2br.html" class="${A_CLS}">Spring Creek Meadows 2BR</a> for a second data point.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is $1M in Canmore usually cash-flow negative?',
        a: 'Often yes under STR financing and fee loads — see the matching analysis page.',
      },
      {
        q: 'Is Canmore a good investment at $1M?',
        a: 'It depends on goals — monthly cash, lifestyle use, and basis matter more than headline STR demand.',
      },
      {
        q: 'What improves the outcome?',
        a: 'Larger down payment, better purchase basis, or materially higher occupancy.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Yes in many buildings — they are decisive at this price tier.',
      },
    ],
    related: {
      p1: `Framework: <a href="../guides/canmore-roi-explained.html" class="${A_CLS}">Canmore ROI explained</a> separates cash flow from appreciation.`,
      p2: `Upside operating profile: <a href="../scenarios/canmore-high-cash-flow.html" class="${A_CLS}">high cash flow scenario</a> — compare requirements.`,
    },
  },
  {
    file: 'canmore-negative-cash-flow.html',
    pageTitle: 'Negative Cash Flow Canmore STR (2026) — When & Why | Canmore ROI',
    schemaName: 'Negative Cash Flow Canmore STR (2026)',
    description:
      'See when Canmore STR shows negative monthly carry and how to spot it pre-offer. Most properties do not perform as expected under leverage — verify before you buy.',
    url: BASE + '/scenarios/canmore-negative-cash-flow.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Scenarios', item: BASE + '/index.html#scenarios-programmatic' },
      { name: 'Negative cash flow', item: BASE + '/scenarios/canmore-negative-cash-flow.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#scenarios-programmatic', label: 'Scenarios' },
      { label: 'Negative cash flow' },
    ],
    h1: 'Negative cash flow (Canmore STR)',
    shortAnswer:
      'Negative carry means revenue after core costs does not cover mortgage, HOA, and reserve reality. In Canmore, high basis plus competition makes this common for leveraged buyers — most investors get this wrong by calling it “temporary” without funding the gap.',
    table: {
      caption: 'Common negative-carry triggers',
      headers: ['Trigger', 'What to watch'],
      rows: [
        ['LTV > ~70%', 'Debt service swallows thin STR margins'],
        ['Occupancy under mid-60s', 'Fixed costs do not shrink with empty nights'],
        ['High HOA / insurance', 'Dollar drag even when gross looks fine'],
        ['Discounting to fill', 'Nights booked, ADR collapsed'],
      ],
    },
    sections: [
      {
        h: 'Why do Canmore STR properties go negative monthly?',
        paragraphs: [
          `Purchase price, financing, and HOA are <strong>fixed</strong> while STR gross moves with calendar and competition. This is where deals break when underwriting used peak weeks as “normal.”`,
        ],
      },
      {
        h: 'What do negative months look like in dollars?',
        paragraphs: [
          `Deficits often land <strong>$200–$1,200+/month</strong> depending on leverage — see <a href="../analysis/solara-studio.html" class="${A_CLS}">Solara studio</a> and <a href="../analysis/silvertip-luxury-chalet.html" class="${A_CLS}">Silvertip luxury chalet</a> for contrasting examples.`,
        ],
      },
      {
        h: 'Is negative cash flow always a mistake?',
        paragraphs: [
          `Not always — if it is <strong>intentional</strong>, funded, and modeled. Most investors get this wrong by accident, then discover the gap in month four.`,
        ],
      },
      {
        h: 'What should I read before offering?',
        paragraphs: [
          `Study <a href="../guides/canmore-investment-mistakes.html" class="${A_CLS}">investment mistakes</a> and stress revenue on the <a href="../index.html#analysis" class="${A_CLS}">calculator</a>.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is negative cash flow always a mistake?',
        a: 'Not always — but it must be intentional, funded, and understood.',
      },
      {
        q: 'What are the risks of investing in Canmore with leverage?',
        a: 'Small revenue misses erase thin margins when debt service and fees are large in absolute dollars.',
      },
      {
        q: 'Fastest way out of negative carry?',
        a: 'Lower loan balance, raise occupancy, cut costs, or reduce purchase price.',
      },
      {
        q: 'Is Canmore Airbnb profitable if I am negative monthly?',
        a: 'Not on a cash basis — you may still have other goals, but do not confuse them with monthly solvency.',
      },
    ],
    related: {
      p1: `Entry band context: <a href="../scenarios/canmore-500k-investment.html" class="${A_CLS}">$500K scenario</a>.`,
      p2: `Second analysis anchor: <a href="../analysis/clearwater-canmore-1br.html" class="${A_CLS}">Clearwater 1BR</a>.`,
    },
  },
  {
    file: 'canmore-break-even-investment.html',
    pageTitle: 'Break-Even Canmore STR (2026) — Thin Margin Truth | Canmore ROI',
    schemaName: 'Break-Even Canmore STR (2026)',
    description:
      'See what break-even STR really means in Canmore: assumptions, volatility, and who should accept thin margin. Most properties do not perform as expected when one fee jumps — verify before you buy.',
    url: BASE + '/scenarios/canmore-break-even-investment.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Scenarios', item: BASE + '/index.html#scenarios-programmatic' },
      { name: 'Break-even', item: BASE + '/scenarios/canmore-break-even-investment.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#scenarios-programmatic', label: 'Scenarios' },
      { label: 'Break-even' },
    ],
    h1: 'Break-even STR investment',
    shortAnswer:
      'Break-even means monthly net hovers near zero after financing and operating bundle — small wins or losses month to month. Most investors get this wrong by calling it “safe”; this is where deals break when one slow month or a fee jump flips the sign.',
    table: {
      caption: 'Break-even band (illustrative, matches site calculator labels)',
      headers: ['Monthly net (modeled)', 'Label'],
      rows: [
        ['Roughly -$200 to +$500', 'Break-even band'],
        ['Below -$200', 'Negative carry territory'],
        ['Above +$500', 'Stronger self-sustaining profile'],
      ],
    },
    sections: [
      {
        h: 'What does break-even mean for a Canmore STR?',
        paragraphs: [
          `You are not “printing yield” — you are treading water with <strong>thin margin</strong>. Numbers look good on paper until insurance resets or shoulder weeks soften.`,
        ],
      },
      {
        h: 'What assumptions usually produce break-even?',
        paragraphs: [
          `Occupancy in the <strong>high 50s to low 60s</strong>, disciplined management fees, no special assessments in-window, and purchase price aligned with rent potential.`,
        ],
      },
      {
        h: 'Which analyses show break-even-style outcomes?',
        paragraphs: [
          `Compare <a href="../analysis/downtown-canmore-condo.html" class="${A_CLS}">downtown condo</a>, <a href="../analysis/pektin-crossing-2br.html" class="${A_CLS}">Pektin Crossing 2BR</a>, and <a href="../analysis/mystic-springs-townhome.html" class="${A_CLS}">Mystic Springs townhome</a> for product-level nuance.`,
        ],
      },
      {
        h: 'Who should accept break-even investing?',
        paragraphs: [
          `Patient owners combining <strong>use + rent</strong>, or equity builders with modest monthly cash needs — read <a href="../guides/str-income-canmore.html" class="${A_CLS}">STR income mechanics</a> so gross is not overstated.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is break-even a good investment?',
        a: 'It can be — if you price in volatility and keep operating reserves.',
      },
      {
        q: 'What metrics matter most at break-even?',
        a: 'Occupancy stability and fee trajectory — not peak-week screenshots.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Often yes — a small fee change moves break-even deals fastest.',
      },
      {
        q: 'Is Canmore Airbnb profitable at break-even?',
        a: 'Barely on cash — you are covering costs, not harvesting large monthly distributions.',
      },
    ],
    related: {
      p1: `Upside path: <a href="../scenarios/canmore-high-cash-flow.html" class="${A_CLS}">high cash flow scenario</a>.`,
      p2: `Downside path: <a href="../scenarios/canmore-negative-cash-flow.html" class="${A_CLS}">negative cash flow scenario</a>.`,
    },
  },
  {
    file: 'canmore-high-cash-flow.html',
    pageTitle: 'High Cash Flow Canmore STR (2026) — What It Actually Takes | Canmore ROI',
    schemaName: 'High Cash Flow Canmore STR (2026)',
    description:
      'See what high STR cash flow requires in Canmore: basis, occupancy, and fee discipline. Most properties do not perform as expected without the right purchase price — verify before you buy.',
    url: BASE + '/scenarios/canmore-high-cash-flow.html',
    breadcrumb: [
      { name: 'Home', item: BASE + '/' },
      { name: 'Scenarios', item: BASE + '/index.html#scenarios-programmatic' },
      { name: 'High cash flow', item: BASE + '/scenarios/canmore-high-cash-flow.html' },
    ],
    crumbs: [
      { href: '../index.html', label: 'Home' },
      { href: '../index.html#scenarios-programmatic', label: 'Scenarios' },
      { label: 'High cash flow' },
    ],
    h1: 'High STR cash flow',
    shortAnswer:
      'High cash flow here means materially above a self-sustaining monthly threshold — usually requiring strong gross, controlled fees, and conservative leverage. Most investors get this wrong by copying someone else’s ADR without copying their occupancy and cost stack; this is where deals break under one soft season.',
    table: {
      caption: 'Requirements vs typical market-clearing deals',
      headers: ['Lever', 'High-flow profile', 'Typical buyer mistake'],
      rows: [
        ['Purchase basis', 'Below or at rent-implied value', 'Paying full tourist-story premium'],
        ['Occupancy', 'Blended mid-60s+ for many profiles', 'Annualizing peak calendar'],
        ['Fees', 'Known from strata docs', 'Trusting MLS line only'],
        ['Leverage', 'Conservative LTV', 'Maximum loan on max price'],
      ],
    },
    sections: [
      {
        h: 'How much monthly cash flow is “high” in Canmore?',
        paragraphs: [
          `Think <strong>well above +$500/month</strong> after the site’s simplified cost bundle — top-quartile modeled cases might land <strong>$900–$1,400+/month</strong>, not guaranteed.`,
        ],
      },
      {
        h: 'What does it take operationally?',
        paragraphs: [
          `Blended occupancy often <strong>mid-60s+</strong>, ADR supported by bed count and amenities, and fee load verified — not guessed.`,
        ],
      },
      {
        h: 'Which analyses show stronger positive profiles?',
        paragraphs: [
          `Review <a href="../analysis/spring-creek-meadows-2br.html" class="${A_CLS}">Spring Creek Meadows 2BR</a> and <a href="../analysis/canyon-ridge-townhouse.html" class="${A_CLS}">Canyon Ridge townhouse</a> — then compare assumptions to your deal.`,
        ],
      },
      {
        h: 'Who actually achieves high cash flow?',
        paragraphs: [
          `Experienced operators or buyers who paid the <strong>right basis</strong> — rarely first-time maximum-leverage investors. Framework: <a href="../guides/canmore-roi-explained.html" class="${A_CLS}">ROI explained</a>.`,
        ],
      },
    ],
    faq: [
      {
        q: 'Is high cash flow common in Canmore?',
        a: 'No — it is the exception when purchase price and fees are market-clearing.',
      },
      {
        q: 'Is Canmore Airbnb profitable at scale?',
        a: 'Gross can be — net profitability still depends on basis, occupancy, and fee discipline.',
      },
      {
        q: 'What is the number one lever?',
        a: 'Purchase price relative to realistic gross — everything else is secondary.',
      },
      {
        q: 'Do Canmore condos have high fees?',
        a: 'Often yes — fee discipline is what separates high-flow stories from break-even fiction.',
      },
    ],
    related: {
      p1: `Contrast: <a href="../scenarios/canmore-negative-cash-flow.html" class="${A_CLS}">negative cash flow scenario</a>.`,
      p2: `Run sensitivity on the <a href="../index.html#analysis" class="${A_CLS}">calculator</a>.`,
    },
  },
];

function renderArea(a) {
  const faqHtml = a.faq
    .map(function (f) {
      return `<div><dt class="font-semibold text-brand-green">${esc(f.q)}</dt><dd class="mt-2 text-sm text-neutral-700">${esc(f.a)}</dd></div>`;
    })
    .join('');
  const tableBlock = renderTable(a.table);
  return (
    head(a) +
    `<body class="bg-brand-cream font-sans text-neutral-800 antialiased">
${header()}
  <main class="mx-auto max-w-3xl px-6 py-12 md:py-16">
    <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Area guide</p>
    ${breadcrumbsHtml(a.crumbs)}
    <h1 class="mt-2 font-serif text-3xl font-semibold text-brand-green md:text-4xl">${esc(a.h1)}</h1>
    ${primaryAnswerBlock(a.shortAnswer)}
    ${tableBlock}
    ${renderSections(a.sections)}
    ${relatedTwoParagraphs(a.related.p1, a.related.p2)}
    ${takeawaysSection(a.takeaways || defaultTakeawaysForArea(a), 'area')}
    <section class="mt-12 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm" aria-labelledby="faq-a"><h2 id="faq-a" class="font-serif text-xl font-semibold text-brand-green">FAQ</h2><dl class="mt-6 space-y-6">${faqHtml}</dl></section>
  </main>
${footer()}
</body></html>`
  );
}

function renderScenario(s) {
  const faqHtml = s.faq
    .map(function (f) {
      return `<div><dt class="font-semibold text-brand-green">${esc(f.q)}</dt><dd class="mt-2 text-sm text-neutral-700">${esc(f.a)}</dd></div>`;
    })
    .join('');
  return (
    head(s) +
    `<body class="bg-brand-cream font-sans text-neutral-800 antialiased">
${header()}
  <main class="mx-auto max-w-3xl px-6 py-12 md:py-16">
    <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Scenario</p>
    ${breadcrumbsHtml(s.crumbs)}
    <h1 class="mt-2 font-serif text-3xl font-semibold text-brand-green md:text-4xl">${esc(s.h1)}</h1>
    ${primaryAnswerBlock(s.shortAnswer)}
    ${renderTable(s.table)}
    ${renderSections(s.sections)}
    ${relatedTwoParagraphs(s.related.p1, s.related.p2)}
    ${takeawaysSection(s.takeaways || defaultTakeawaysForScenario(s), 'scenario')}
    <section class="mt-12 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm" aria-labelledby="faq-s"><h2 id="faq-s" class="font-serif text-xl font-semibold text-brand-green">FAQ</h2><dl class="mt-6 space-y-6">${faqHtml}</dl></section>
  </main>
${footer()}
</body></html>`
  );
}

const areasDir = path.join(ROOT, 'areas');
const scenDir = path.join(ROOT, 'scenarios');
fs.mkdirSync(areasDir, { recursive: true });
fs.mkdirSync(scenDir, { recursive: true });

areas.forEach(function (a) {
  fs.writeFileSync(path.join(areasDir, a.file), renderArea(a), 'utf8');
  console.log('Wrote areas/' + a.file);
});
scenarios.forEach(function (s) {
  fs.writeFileSync(path.join(scenDir, s.file), renderScenario(s), 'utf8');
  console.log('Wrote scenarios/' + s.file);
});
