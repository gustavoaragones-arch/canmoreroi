# GSC-DIAG-01 — Indexing Diagnostic & Remediation Report

**Site:** CanmoreROI.com (static, Vercel)  
**Date:** 2026-05-20  
**Status:** Remediation implemented in codebase

---

## 1. Executive summary

Google Search Console reported two primary issue classes:

| GSC issue | Count (reported) | Root cause | Fix |
|-----------|------------------|------------|-----|
| Page with redirect | ~10 | Legacy `.html` / `index.html` URLs + extensionless analysis redirects | `vercel.json` 301 map; sitemap lists final URLs only |
| Duplicate without user-selected canonical | 1+ | Homepage calculator `history.replaceState` creates `?price=&down=&rate=&occ=` URLs with same content as `/` but no `noindex` | `canonical-engine.js` + `robots.txt` param disallow |

---

## 2. Diagnostic audit (A–L)

### A. Canonicals

| Check | Result before | Result after |
|-------|---------------|--------------|
| Absolute HTTPS canonicals on all HTML | Pass (48 pages) | Pass |
| Homepage always `https://canmoreroi.com/` | Pass static tag | Enforced on param URLs via engine |
| Analysis property pages extensionless | `/analysis/{slug}` | Unchanged (matches sitemap + Vercel rewrite) |
| Knowledge hub trailing slash | `/knowledge/` | Unchanged |
| No parameterized canonicals | Fail (params not blocked) | Pass (engine + validation) |

**Note:** Section 5A examples show `.html` analysis URLs; production canonical architecture intentionally uses **extensionless** analysis URLs with `.html` → slug 301s (avoids duplicate index of both forms).

### B. Redirects (`vercel.json`)

| Source | Destination | Purpose |
|--------|-------------|---------|
| `www.canmoreroi.com/*` | `https://canmoreroi.com/*` | WWW normalization |
| `/index.html` | `/` | Homepage duplicate |
| `/analysis/index.html` | `/analysis/` | Hub duplicate |
| `/knowledge/index.html` | `/knowledge/` | Knowledge hub duplicate |
| `/analysis` | `/analysis/` | Trailing slash |
| `/knowledge` | `/knowledge/` | Trailing slash |
| `/analysis/:slug.html` | `/analysis/:slug` | Extension normalization |

**Rewrite (not redirect):** `/analysis/:slug` → `/analysis/:slug.html` (single hop to content).

### C. Internal links

- Nav/footer: canonical paths (`/`, `/analysis/`, `/knowledge/`) — pass.
- **Found:** JSON-LD breadcrumbs in guides/knowledge still referenced `index.html` and `knowledge/index.html` — fixed by `validate-indexing.js --fix`.

### D. Sitemap

- 47 URLs, all HTTPS absolute.
- No `index.html`, no query strings.
- Lists extensionless analysis URLs (200 via rewrite).
- `dynamic.html` / `template.html` excluded.

### E. Robots

- `Allow: /`
- Disallow calculator/share params: `?price=`, `?down=`, `?rate=`, `?occ=`, `?price_b=`, `?down_b=`, `?rate_b=`, `?occ_b=`, `?compare=`, `?note=`, `?view=`
- Disallow `/analysis/dynamic.html`, `/analysis/template.html`, assets/scripts
- Sitemap declared

### F. Query parameters

| Param | Indexed before | After |
|-------|----------------|-------|
| `price`, `down`, `rate`, `occ` | Yes (duplicate homepage) | `noindex,follow` + canonical `/` |
| `price_b`, `down_b`, `rate_b`, `occ_b` | Risk | Same |
| `note`, `view`, `compare` | Risk | Same |
| Share/PDF UX | Works | Unchanged |

### G. HTML / index normalization

- Physical files remain `.html` on disk (static hosting).
- Public URLs normalized via redirects above.

### H. Meta robots

- Homepage: dynamic `noindex,follow` when indexing params present.
- `analysis/dynamic.html`: static `noindex,follow` always (tool page).

### I. Dynamic share URLs

- `generateShareURL()` / `syncUrlFromInputs()` unchanged.
- SEO layer runs `CanonicalEngine.apply()` after URL updates.

### J. PDF / report

- `#report-export` off-screen, `aria-hidden`, not in sitemap — no crawl trap.
- No new URLs created.

### K. Vercel routing

- Redirect chain max: 1 hop (e.g. `.html` slug → extensionless → rewrite to file).
- No loops.

### L. Trailing slash

- Hubs: `/analysis/`, `/knowledge/` canonical + redirects from bare paths.

---

## 3. Root causes (exact)

1. **Parameterized homepage URLs** — Calculator syncs state to `?price=…` without `noindex`, while canonical stayed `/`. Google treated param URLs as separate documents → “Duplicate without user-selected canonical.”

2. **Redirect surfaces in GSC** — Intentional 301s from `/index.html`, `/analysis/index.html`, and `/analysis/*.html` to canonical paths. Expected during migration; sitemap must only list destinations (already true).

3. **JSON-LD legacy URLs** — Breadcrumbs pointed at `index.html` variants, encouraging discovery of redirecting URLs.

4. **HTTP/WWW** — `http://canmoreroi.com/` in GSC is legacy/host variant; Vercel enforces HTTPS; WWW redirect added explicitly.

---

## 4. Files modified

| File | Change |
|------|--------|
| `js/seo/canonical-engine.js` | **New** — param detection, canonical enforcement, noindex |
| `scripts/seo-params.js` | **New** — shared param key list |
| `scripts/validate-indexing.js` | **New** — indexing validation + JSON-LD fix |
| `index.html` | Load canonical engine; re-apply after `replaceState` |
| `analysis/dynamic.html` | Static noindex + canonical engine |
| `vercel.json` | WWW, knowledge, trailing-slash redirects |
| `robots.txt` | Param disallow rules |
| `scripts/build-sitemap.js` | Compare URLs use `canonicalForRelPath` |
| `package.json` | `validate:indexing` script |
| `docs/GSC-DIAG-01-REPORT.md` | This report |
| Guides/knowledge HTML | JSON-LD URL cleanup (via `--fix`) |

---

## 5. Canonical map (indexable)

| Page type | Canonical URL pattern |
|-----------|------------------------|
| Homepage | `https://canmoreroi.com/` |
| Analysis hub | `https://canmoreroi.com/analysis/` |
| Analysis property | `https://canmoreroi.com/analysis/{slug}` |
| Guides | `https://canmoreroi.com/guides/{file}.html` |
| Knowledge article | `https://canmoreroi.com/knowledge/{file}.html` |
| Knowledge hub | `https://canmoreroi.com/knowledge/` |
| Areas / scenarios | `https://canmoreroi.com/{dir}/{file}.html` |
| Legal | `https://canmoreroi.com/legal/{file}.html` |

**Never indexable:** `/?price=…`, `/analysis/dynamic.html?…`, `/analysis/template.html`, `/data/`, `/scripts/`.

---

## 6. Redirect map

See Section 2B. GSC “Page with redirect” entries for old URLs should **drop** after recrawl; do not remove redirects.

---

## 7. Sitemap cleanup

- Already clean: no params, no `index.html`.
- Run after changes: `npm run build:sitemap`

---

## 8. Validation

```bash
npm run validate:seo
npm run validate:indexing
npm run build:sitemap
```

---

## 9. Remaining risks

| Risk | Mitigation |
|------|------------|
| GSC lag (weeks) | Request validation on param URLs after deploy |
| External links to old `.html` analysis URLs | 301 to extensionless; monitor GSC |
| `robots.txt` query disallow is weak vs `noindex` | `noindex` is primary; robots is belt-and-suspenders |
| CDN/cache of old HTML | Purge Vercel cache on deploy |

---

## 10. Success criteria (post-recrawl)

- [ ] 0 “Duplicate without user-selected canonical” for `?price=` homepage URLs  
- [ ] “Page with redirect” only for obsolete URLs (declining)  
- [ ] Indexed pages match sitemap canonical set  
- [ ] Share/calculator/PDF UX still works  

---

## 11. Post-deploy checklist

1. Deploy to Vercel (`main`).  
2. Verify `https://canmoreroi.com/?price=850000&down=20` → view-source: `noindex` + canonical `/`.  
3. Verify `https://canmoreroi.com/index.html` → 301 → `/`.  
4. Submit sitemap in GSC.  
5. Validate fix on affected URLs in GSC.
