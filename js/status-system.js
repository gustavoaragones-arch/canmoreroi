/**
 * Centralized investment status language — visual only, thresholds unchanged.
 * Used by homepage calculator, comparison, PDF export, analysis pages.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.CanmoreRoiStatus = api;
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ICONS = {
    positive:
      '<svg class="roi-status-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 13L14 3M14 3H7M14 3V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    neutral:
      '<svg class="roi-status-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 9H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    negative:
      '<svg class="roi-status-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 5L14 15M14 15H7M14 15V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  var COMMENTS = {
    positive:
      'This scenario generates sufficient cash flow to cover expected operating costs and financing obligations.',
    neutral:
      'This scenario operates near equilibrium and may be sensitive to occupancy fluctuations.',
    negative:
      'This scenario may require owner contributions during lower-demand periods.',
  };

  function buildStatus(tier, label, badge, detail, color) {
    return {
      tier: tier,
      color: color,
      label: label,
      badge: badge,
      detail: detail,
      comment: COMMENTS[tier],
      icon: ICONS[tier],
      tierClass: 'roi-status-tier--' + tier,
    };
  }

  function signalFromCashflow(cashflow) {
    var cf = Number(cashflow);
    if (!isFinite(cf)) cf = 0;
    if (cf > 500) {
      return buildStatus('positive', 'Self-Sustaining', 'Positive Cash Flow', 'over $500 / mo', 'green');
    }
    if (cf < -200) {
      return buildStatus('negative', 'Negative Carry', 'Negative Cash Flow', 'under −$200 / mo', 'red');
    }
    return buildStatus('neutral', 'Break-even', 'Break-even', '−$200 to $500 / mo', 'yellow');
  }

  function signalFromKey(key) {
    var k = String(key || '')
      .toLowerCase()
      .replace(/\s+/g, '-');
    if (k === 'self-sustaining' || k === 'self_sustaining' || k === 'positive') {
      return signalFromCashflow(501);
    }
    if (k === 'negative' || k === 'negative-carry' || k === 'negative_carry') {
      return signalFromCashflow(-201);
    }
    return signalFromCashflow(0);
  }

  function renderBadgeHTML(status) {
    return (
      '<span class="roi-status-badge ' +
      status.tierClass +
      '" role="status" aria-label="' +
      escapeAttr(status.badge) +
      '">' +
      status.icon +
      '<span>' +
      escapeHtml(status.badge) +
      '</span></span>'
    );
  }

  function renderOutlookHTML(status, opts) {
    opts = opts || {};
    var showRange = opts.showRange !== false;
    var html =
      '<div class="roi-status-outlook ' +
      status.tierClass +
      '">' +
      '<p class="roi-status-outlook-label">Investment Outlook</p>' +
      '<p class="roi-status-outlook-title">' +
      status.icon +
      '<span>' +
      escapeHtml(status.label) +
      '</span></p>' +
      '<p class="roi-status-outlook-comment">' +
      escapeHtml(status.comment) +
      '</p>';
    if (showRange && status.detail) {
      html += '<p class="roi-status-outlook-range">Modeled band: ' + escapeHtml(status.detail) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderAnalysisBlockHTML(status) {
    return (
      '<div class="roi-status-analysis-panel">' +
      renderBadgeHTML(status) +
      renderOutlookHTML(status, { showRange: false }) +
      '</div>'
    );
  }

  function renderCompactHTML(status) {
    return (
      '<span class="roi-status-compact ' +
      status.tierClass +
      '">' +
      status.icon +
      ' <strong>' +
      escapeHtml(status.label) +
      '</strong></span>'
    );
  }

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

  function amountClass(status) {
    return 'roi-status-amount ' + status.tierClass;
  }

  function applyToSnapshot(cashflow, elements, fmt) {
    var status = signalFromCashflow(cashflow);
    var flowEl = elements.flow;
    var badgeWrap = elements.badgeWrap || elements.badge;
    var outlookEl = elements.outlook;

    if (flowEl) {
      flowEl.textContent = fmt ? fmt(cashflow) : String(cashflow);
      flowEl.className = (elements.flowBase || '') + amountClass(status);
    }
    if (badgeWrap) {
      badgeWrap.innerHTML = renderBadgeHTML(status);
    }
    if (outlookEl) {
      outlookEl.innerHTML = renderOutlookHTML(status);
    }
    return status;
  }

  function applyBlankSnapshot(elements, fmt) {
    return applyToSnapshot(0, elements, fmt);
  }

  function chartBarColor(cashflow) {
    var s = signalFromCashflow(cashflow);
    if (s.tier === 'positive') return '#1F3A33';
    if (s.tier === 'negative') return '#7A4A45';
    return '#B08D57';
  }

  /** Backward-compatible shape for canmoreRoiPaybackSignal consumers */
  function toLegacySignal(status) {
    return {
      tier: status.tier,
      label: status.label,
      color: status.color,
      badge: status.badge,
      detail: status.detail,
      comment: status.comment,
      badgeHTML: renderBadgeHTML(status),
      outlookHTML: renderOutlookHTML(status),
      tierClass: status.tierClass,
    };
  }

  function paybackSignal(cashflow) {
    return toLegacySignal(signalFromCashflow(cashflow));
  }

  return {
    ICONS: ICONS,
    signalFromCashflow: signalFromCashflow,
    signalFromKey: signalFromKey,
    paybackSignal: paybackSignal,
    renderBadgeHTML: renderBadgeHTML,
    renderOutlookHTML: renderOutlookHTML,
    renderAnalysisBlockHTML: renderAnalysisBlockHTML,
    renderCompactHTML: renderCompactHTML,
    amountClass: amountClass,
    applyToSnapshot: applyToSnapshot,
    applyBlankSnapshot: applyBlankSnapshot,
    chartBarColor: chartBarColor,
    toLegacySignal: toLegacySignal,
  };
});
