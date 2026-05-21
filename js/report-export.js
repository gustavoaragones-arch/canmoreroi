/**
 * Client-side investment brief PDF (html2canvas + jsPDF). No server routes.
 */
(function () {
  'use strict';

  var reportOccChart = null;

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

    function set(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
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
    set(
      'report-assumptions-body',
      'Purchase ' +
        fmtMoney(inputs.price, R) +
        ' · Down ' +
        inputs.down +
        '% · Loan ~' +
        fmtMoney(loan, R) +
        ' · Nightly ' +
        fmtMoney(inputs.rate, R) +
        ' · Occupancy ' +
        Math.round(inputs.occ * 100) +
        '%. Revenue = nightly × occupancy × 30. Financing ≈ 0.5% of loan balance per month. Fixed operating estimate $1,500/mo (fees, tax, utilities bundle).'
    );

    var market = R.getMarketData();
    if (market) {
      set('report-market-avg', fmtMoney(market.avg_price, R));
      set('report-market-quarter', fmtPct(market.quarterly_change));
      set('report-market-month', fmtPct(market.monthly_change));
      set('report-market-updated', market.last_updated || 'local market estimates');
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

    pdf.save('canmore-roi-report.pdf');
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
