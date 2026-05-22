/**
 * Client-side SEO normalization: calculator/share query params must not create indexable URLs.
 * Static canonical in HTML remains the source of truth; this layer enforces noindex + canonical on param URLs.
 */
(function () {
  'use strict';

  var SITE = 'https://canmoreroi.com';
  var PARAM_KEYS = [
    'price',
    'down',
    'rate',
    'occ',
    'price_b',
    'down_b',
    'rate_b',
    'occ_b',
    'compare',
    'note',
    'view',
  ];

  function hasIndexingParams(search) {
    if (!search || search === '?') return false;
    var p = new URLSearchParams(search.charAt(0) === '?' ? search.slice(1) : search);
    for (var i = 0; i < PARAM_KEYS.length; i++) {
      if (p.has(PARAM_KEYS[i])) return true;
    }
    return false;
  }

  function pathnameNorm() {
    var p = window.location.pathname || '/';
    if (p.endsWith('/index.html')) {
      return p.slice(0, -'/index.html'.length) || '/';
    }
    return p;
  }

  function getDefaultCanonical() {
    var script = document.currentScript;
    if (script && script.getAttribute('data-default-canonical')) {
      return script.getAttribute('data-default-canonical');
    }
    var link = document.querySelector('link[rel="canonical"]');
    return link ? link.getAttribute('href') : SITE + pathnameNorm();
  }

  function upsertCanonical(href) {
    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  function upsertRobots(content) {
    var el = document.querySelector('meta[name="robots"]:not([data-seo-static])');
    if (!el) {
      el = document.createElement('meta');
      el.name = 'robots';
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function clearDynamicNoindex() {
    var el = document.querySelector('meta[name="robots"]:not([data-seo-static])');
    if (el) el.remove();
  }

  function isParamSensitivePath(path) {
    return (
      path === '/' ||
      path === '' ||
      path === '/analysis/dynamic.html' ||
      path === '/analysis/dynamic'
    );
  }

  function apply() {
    var path = pathnameNorm();
    var search = window.location.search || '';
    var defaultCanon = getDefaultCanonical();

    if (hasIndexingParams(search) && isParamSensitivePath(path)) {
      if (path === '/' || path === '') {
        upsertCanonical(SITE + '/');
      } else {
        upsertCanonical(SITE + '/analysis/');
      }
      upsertRobots('noindex,follow');
      return;
    }

    upsertCanonical(defaultCanon);
    if (!document.querySelector('meta[name="robots"][data-seo-static]')) {
      clearDynamicNoindex();
    }
  }

  apply();
  window.addEventListener('popstate', apply);
  window.addEventListener('pageshow', apply);

  window.CanonicalEngine = {
    SITE: SITE,
    PARAM_KEYS: PARAM_KEYS,
    hasIndexingParams: hasIndexingParams,
    apply: apply,
  };
})();
