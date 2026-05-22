# GSC-FIX-02 — Execution & Deployment Checklist

## Implemented

- [x] `js/seo/canonical-engine.js` — param detection, canonical force, `noindex,follow`
- [x] Homepage wired (`index.html`) + `CanonicalEngine.apply()` after `replaceState`
- [x] `analysis/dynamic.html` — permanent `noindex` + engine
- [x] `vercel.json` — index.html, hub, www, trailing slash, analysis `.html` → slug
- [x] `robots.txt` — param disallow rules
- [x] `scripts/validate-indexing.js` — full validation suite
- [x] JSON-LD / internal link cleanup (no `index.html` in schema)
- [x] No crawlable `href="?price=..."` links
- [x] Share/PDF via clipboard + `replaceState` only

## Pre-deploy commands

```bash
npm run build:sitemap
npm run validate:all
```

## Post-deploy manual tests

| URL | Expected |
|-----|----------|
| `/?price=850000&down=20` | `canonical` → `https://canmoreroi.com/`, `noindex,follow` |
| `/index.html` | 301 → `/` |
| `/analysis/index.html` | 301 → `/analysis/` |
| `/guides/canmore-roi-explained.html` | 200, self-canonical, indexable |

## Google Search Console (after deploy only)

1. Resubmit `https://canmoreroi.com/sitemap.xml`
2. URL Inspection on affected param URLs
3. Request indexing for canonical content URLs
4. **Validate fix** on duplicate canonical issue

## Success metrics

- 0 duplicate canonical errors (param URLs)
- 0 parameter URLs in indexed pages
- Sitemap = canonical 200 URLs only
- Redirect count declines over 2–6 weeks
