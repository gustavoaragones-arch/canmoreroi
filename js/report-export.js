/**
 * Client-side investment brief PDF (html2canvas + jsPDF). No server routes.
 */
(function () {
  'use strict';

  var reportOccChart = null;
  var lastExportMeta = { id: '', filename: 'canmore-roi-report.pdf' };

  /** Typical Canmore STR modeling bands (not investment advice). */
  var CONFIDENCE_BANDS = {
    occHigh: 0.8,
    rateHigh: 425,
    downLow: 20,
  };

  function api() {
    return window.CanmoreRoiReport || null;
  }

  function createPdf() {
    var J = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    if (!J) throw new Error('jsPDF not loaded');
    return new J('p', 'mm', 'a4');
  }

  function formatNote(slug) {
    if (!slug) return '';
    return slug
      .split('-')
      .filter(Boolean)
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  function todayUS() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return m + '/' + day + '/' + d.getFullYear();
  }

  function isoDateStamp() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function monthStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function generateReportId() {
    var suffix = String(Math.floor(1000 + Math.random() * 9000));
    return 'ROI-' + isoDateStamp() + '-' + suffix;
  }

  function computeAssumptionConfidence(inputs) {
    var reasons = [];
    var occPct = inputs.occ * 100;
    if (occPct > CONFIDENCE_BANDS.occHigh * 100) {
      reasons.push('Occupancy above 80% is optimistic for many Canmore STR assets.');
    }
    if (inputs.rate > CONFIDENCE_BANDS.rateHigh) {
      reasons.push('Nightly rate is above typical modeled bands for the market.');
    }
    if (inputs.down < CONFIDENCE_BANDS.downLow) {
      reasons.push('Down payment below 20% increases leverage and sensitivity to rate changes.');
    }
    var level = 'High';
    if (reasons.length === 1) level = 'Moderate';
    if (reasons.length >= 2) level = 'Low';
    return { level: level, reasons: reasons };
  }

  function generatePdfFilename(noteSlug, inputs) {
    var stamp = monthStamp();
    if (noteSlug) {
      var safe = noteSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
      if (safe) return 'canmore-roi-' + safe + '-' + stamp + '.pdf';
    }
    var priceK = Math.max(1, Math.round(inputs.price / 1000)) + 'k';
    var occ = Math.round(inputs.occ * 100) + 'occ';
    return 'canmore-roi-' + priceK + '-' + occ + '-' + stamp + '.pdf';
  }

  function fmtMoney(n, R) {
    if (R && R.fmtCurrency) return R.fmtCurrency(n);
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  }

  function fmtPct(n) {
    var x = Number(n);
    if (!isFinite(x)) return '—';
    return (x >= 0 ? '+' : '') + x + '%';
  }

  function signalClass(color) {
    if (color === 'green') return 'report-signal report-signal--green';
    if (color === 'red') return 'report-signal report-signal--red';
    return 'report-signal report-signal--yellow';
  }

  function renderOccupancyChart(R, inputs) {
    var canvas = document.getElementById('report-occ-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    var occLevels = [0.45, 0.55, 0.65, 0.75, 0.85];
    var flows = occLevels.map(function (o) {
      return R.calculateScenario({
        price: inputs.price,
        down: inputs.down,
        rate: inputs.rate,
        occ: o,
      }).cashflow;
    });
    if (reportOccChart) {
      reportOccChart.destroy();
      reportOccChart = null;
    }
    reportOccChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: occLevels.map(function (o) {
          return Math.round(o * 100) + '%';
        }),
        datasets: [
          {
            label: 'Monthly net (CAD)',
            data: flows,
            backgroundColor: flows.map(function (v) {
              return v > 500 ? '#16a34a' : v < -200 ? '#dc2626' : '#ca8a04';
            }),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: function (v) {
                return '$' + v;
              },
            },
          },
        },
      },
    });
  }

  function syncReportExport() {
    var R = api();
    if (!R) return;
    var inputs = R.normalizeInputs(R.getInputs());
    var scen = R.calculateScenario(inputs);
    var payback = R.getPaybackSignal(scen.cashflow);
    var mortgage = inputs.price * (1 - inputs.down / 100) * 0.005;
    var fixed = 1500;
    var params = new URLSearchParams(window.location.search);
    var noteSlug = params.get('note') || '';
    var noteTitle = formatNote(noteSlug);
    var reportId = generateReportId();
    lastExportMeta.id = reportId;
    lastExportMeta.filename = generatePdfFilename(noteSlug, inputs);

    function set(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    set('report-id', reportId);

    var genEl = document.getElementById('report-generated-date');
    if (genEl) genEl.textContent = todayUS();

    var noteRow = document.getElementById('report-note-row');
    var noteEl = document.getElementById('report-scenario-name');
    if (noteRow && noteEl) {
      if (noteTitle) {
        noteRow.hidden = false;
        noteEl.textContent = noteTitle;
      } else {
        noteRow.hidden = true;
      }
    }

    set('report-input-price', fmtMoney(inputs.price, R));
    set('report-input-down', inputs.down + '%');
    set('report-input-rate', fmtMoney(inputs.rate, R) + ' / night');
    set('report-input-occ', Math.round(inputs.occ * 100) + '%');

    var cashEl = document.getElementById('report-cashflow-value');
    if (cashEl) {
      cashEl.textContent = fmtMoney(scen.cashflow, R);
      cashEl.className = 'report-cashflow-value report-cashflow-value--' + payback.color;
    }
    var sigEl = document.getElementById('report-signal-badge');
    if (sigEl) {
      sigEl.textContent = payback.label;
      sigEl.className = signalClass(payback.color);
    }
    var payEl = document.getElementById('report-payback-detail');
    if (payEl) payEl.textContent = payback.emoji + ' ' + payback.label + ' (' + payback.detail + ')';

    var conf = computeAssumptionConfidence(inputs);
    set('report-confidence-level', conf.level);
    var confDetail = document.getElementById('report-confidence-detail');
    if (confDetail) {
      confDetail.textContent =
        conf.reasons.length > 0
          ? conf.reasons.join(' ')
          : 'Inputs fall within typical modeled Canmore STR ranges for this snapshot.';
    }

    set('report-breakdown-revenue', fmtMoney(scen.revenue, R));
    set('report-breakdown-mortgage', fmtMoney(mortgage, R));
    set('report-breakdown-fixed', fmtMoney(fixed, R));
    set('report-breakdown-net', fmtMoney(scen.cashflow, R));

    var interp = document.getElementById('roi-interpretation');
    set('report-what-means', interp ? interp.textContent : '');

    var compSection = document.getElementById('report-comparison-section');
    if (compSection) {
      if (R.isScenarioBFilled()) {
        compSection.hidden = false;
        var a = scen;
        var b = R.calculateScenario(R.normalizeInputs(R.getInputsB(), inputs));
        var diffRoot = document.getElementById('difference-breakdown');
        var summary = document.getElementById('comparison-summary');
        var html = '';
        html +=
          '<div class="report-comp-grid">' +
          '<div><strong>Scenario A</strong><br>Cash flow: ' +
          fmtMoney(a.cashflow, R) +
          '</div>' +
          '<div><strong>Scenario B</strong><br>Cash flow: ' +
          fmtMoney(b.cashflow, R) +
          '</div></div>';
        if (summary && summary.textContent) {
          html += '<p class="report-comp-summary">' + summary.textContent + '</p>';
        }
        if (diffRoot && diffRoot.innerHTML) {
          html += '<div class="report-comp-diff">' + diffRoot.innerHTML + '</div>';
        }
        document.getElementById('report-comparison-body').innerHTML = html;
      } else {
        compSection.hidden = true;
      }
    }

    var loan = inputs.price * (1 - inputs.down / 100);
    var occPct = Math.round(inputs.occ * 100);
    set(
      'report-assumption-occ',
      'Occupancy assumptions: ' +
        occPct +
        '% blended annual occupancy (revenue = nightly rate × occupancy × 30 days per month).'
    );
    set(
      'report-assumption-rate',
      'Nightly rate assumptions: ' +
        fmtMoney(inputs.rate, R) +
        '/night before platform fees, discounts, and cleaning pass-throughs.'
    );
    set(
      'report-assumption-mortgage',
      'Mortgage assumptions: ' +
        inputs.down +
        '% down on ' +
        fmtMoney(inputs.price, R) +
        ' (loan ~' +
        fmtMoney(loan, R) +
        '); financing modeled at ~0.5% of loan balance per month plus $1,500/mo operating bundle.'
    );
    set(
      'report-assumption-reserve',
      'Reserve assumptions: monthly condo/operating estimate does not include special assessments, reserve top-ups, or capex (elevators, roofing, balconies). Verify reserve studies independently.'
    );
    set(
      'report-assumptions-body',
      'Snapshot inputs at generation: purchase ' +
        fmtMoney(inputs.price, R) +
        ', down ' +
        inputs.down +
        '%, occupancy ' +
        occPct +
        '%, nightly ' +
        fmtMoney(inputs.rate, R) +
        '. Report ID ' +
        reportId +
        '.'
    );

    var market = R.getMarketData();
    if (market) {
      var avgPrice = market.avgSoldPrice != null ? market.avgSoldPrice : market.avg_price;
      var monthly = market.monthlyChange != null ? market.monthlyChange : market.monthly_change;
      var quarterly = market.quarterlyChange != null ? market.quarterlyChange : market.quarterly_change;
      set('report-market-avg', fmtMoney(avgPrice, R));
      set('report-market-quarter', fmtPct(quarterly));
      set('report-market-month', fmtPct(monthly));
      set('report-market-updated', market.reportDate || market.last_updated || market.source || 'local market estimates');
    }

    renderOccupancyChart(R, inputs);

    var roiChart = R.getRoiChart();
    var imgEl = document.getElementById('report-roi-chart-img');
    if (imgEl && roiChart && typeof roiChart.toBase64Image === 'function') {
      imgEl.src = roiChart.toBase64Image('image/png', 1);
      imgEl.alt = 'Price vs cash flow chart';
    }
  }

  async function exportPDF() {
    var report = document.getElementById('report-export');
    if (!report) return;
    if (typeof html2canvas !== 'function') {
      alert('PDF export is not available — html2canvas failed to load.');
      return;
    }
    syncReportExport();
    await new Promise(function (r) {
      requestAnimationFrame(function () {
        requestAnimationFrame(r);
      });
    });

    var canvas = await html2canvas(report, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    var img = canvas.toDataURL('image/png');
    var pdf = createPdf();
    var width = 190;
    var imgHeight = (canvas.height * width) / canvas.width;
    var pageHeight = 277;
    var x = 10;
    var position = 10;
    var heightLeft = imgHeight;

    pdf.addImage(img, 'PNG', x, position, width, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(img, 'PNG', x, position, width, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(lastExportMeta.filename || 'canmore-roi-report.pdf');
  }

  function init() {
    var pdfBtn = document.getElementById('pdf-export');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', function () {
        exportPDF().catch(function (err) {
          console.error(err);
          alert('Could not generate PDF. Try again after the charts finish loading.');
        });
      });
    }

    var shareBtn = document.getElementById('share-report');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var R = api();
        var url = R && R.generateShareURL ? R.generateShareURL() : window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(
            function () {
              alert('Report link copied to clipboard.');
            },
            function () {
              window.prompt('Copy this link:', url);
            }
          );
        } else {
          window.prompt('Copy this link:', url);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.exportPDF = exportPDF;
  window.syncReportExport = syncReportExport;
})();
