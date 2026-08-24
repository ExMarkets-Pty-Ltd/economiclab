(function () {
  'use strict';

  var FRED_ENDPOINT = '/.netlify/functions/pce-data';
  var MARKET_ENDPOINT = 'https://exmarkets.netlify.app/.netlify/functions/market-data';
  var data = {};
  var range = 1;
  var tableRange = 1;

  function query(selector) { return document.querySelector(selector); }
  function queryAll(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function setText(selector, value) { var node = query(selector); if (node) node.textContent = value; }
  function formatPercent(value, digits) {
    if (value === null || !Number.isFinite(value)) return 'Data unavailable';
    return (value >= 0 ? '+' : '') + Number(value).toFixed(digits) + '%';
  }
  function formatSigned(value, digits) {
    if (value === null || !Number.isFinite(value)) return 'Data unavailable';
    return (value >= 0 ? '+' : '') + Number(value).toFixed(digits);
  }
  function pctChange(current, previous) {
    if (!current || !previous || !Number.isFinite(previous.value) || previous.value === 0) return null;
    return ((current.value / previous.value) - 1) * 100;
  }
  function parseDate(dateString) {
    if (!dateString) return null;
    var d = new Date(dateString + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function dateLabel(dateString) {
    var d = parseDate(dateString);
    if (!d) return 'Latest available';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  function seriesToArray(series) {
    return (series || []).map(function (item) { return { date: item.date, value: Number(item.value) }; }).filter(function (item) { return Number.isFinite(item.value); });
  }
  function latestValue(seriesId) {
    var list = data[seriesId] || [];
    return list.length ? list[list.length - 1] : null;
  }
  function previousValue(seriesId) {
    var list = data[seriesId] || [];
    return list.length > 1 ? list[list.length - 2] : null;
  }
  function yearAgoValue(seriesId) {
    var list = data[seriesId] || [];
    return list.length > 12 ? list[list.length - 13] : null;
  }
  function renderSnapshot() {
    var headline = latestValue('PCEPI');
    var core = latestValue('PCEPILFE');
    var headlinePrev = previousValue('PCEPI');
    var corePrev = previousValue('PCEPILFE');
    var headlineYoY = headline && yearAgoValue('PCEPI') ? pctChange(headline, yearAgoValue('PCEPI')) : null;
    var coreYoY = core && yearAgoValue('PCEPILFE') ? pctChange(core, yearAgoValue('PCEPILFE')) : null;
    var headlineMom = headline && headlinePrev ? pctChange(headline, headlinePrev) : null;
    var coreMom = core && corePrev ? pctChange(core, corePrev) : null;

    setText('[data-pce="pce-yoy"]', formatPercent(headlineYoY, 2));
    setText('[data-pce="core-yoy"]', formatPercent(coreYoY, 2));
    setText('[data-pce="pce-mom"]', formatPercent(headlineMom, 2));
    setText('[data-pce="core-mom"]', formatPercent(coreMom, 2));
    setText('[data-pce="previous-pce"]', formatPercent(headlinePrev && headline ? pctChange(headlinePrev, (data.PCEPI || []).slice(-3)[0]) : null, 2));
    setText('[data-pce="previous-core"]', formatPercent(corePrev && core ? pctChange(corePrev, (data.PCEPILFE || []).slice(-3)[0]) : null, 2));
    setText('[data-pce="reference-month"]', headline ? dateLabel(headline.date) : 'Data unavailable');
    setText('[data-pce="release-date"]', 'Data unavailable');
    setText('[data-pce="objective-pce"]', formatPercent(headlineYoY, 2));
    setText('[data-pce="objective-core"]', formatPercent(coreYoY, 2));
    setText('[data-pce="objective-diff"]', headlineYoY === null ? 'Data unavailable' : formatSigned(headlineYoY - 2, 2) + ' pp');
    setText('[data-pce="core-yoy-copy"]', formatPercent(coreYoY, 2));
    setText('[data-pce="core-mom-copy"]', formatPercent(coreMom, 2));
    setText('[data-pce="core-vs-target"]', coreYoY === null ? 'Data unavailable' : formatSigned(coreYoY - 2, 2) + ' pp');
    setText('[data-pce="dashboard-pce"]', formatPercent(headlineYoY, 2));
    setText('[data-pce="dashboard-core"]', formatPercent(coreYoY, 2));
    setText('[data-pce="dashboard-mom"]', formatPercent(headlineMom, 2));
    setText('[data-pce="dashboard-core-mom"]', formatPercent(coreMom, 2));
    setText('[data-pce="regime-summary"]', headlineYoY === null ? 'Current inflation regime is currently unavailable.' : (headlineYoY > 2 ? 'PCE inflation is currently above the Federal Reserve objective.' : headlineYoY < 2 ? 'PCE inflation is currently below the Federal Reserve objective.' : 'PCE inflation is currently near the Federal Reserve objective.'));
    setText('[data-pce-status]', headline ? 'Latest available FRED PCE data: ' + dateLabel(headline.date) + '. Release date is still sourced from the official BEA schedule.' : 'No current PCE data available.');
  }

  function buildChart(filtered, targetLineValue) {
    if (!filtered.length) return '<p class="pce-unavailable">No current PCE data available.</p>';
    var width = 900, height = 270, left = 50, right = 18, top = 18, bottom = 35;
    var values = filtered.map(function (item) { return item.value; });
    var min = Math.min(0, Math.min.apply(Math, values));
    var max = Math.max(5, Math.max.apply(Math, values));
    var x = function (index) { return left + index * ((width - left - right) / Math.max(1, filtered.length - 1)); };
    var y = function (value) { return top + (max - value) * ((height - top - bottom) / Math.max(1, max - min)); };
    var path = filtered.map(function (point, index) { return (index ? 'L' : 'M') + x(index).toFixed(1) + ' ' + y(point.value).toFixed(1); }).join(' ');
    var labels = filtered.filter(function (_, index) { return index === 0 || index === filtered.length - 1 || index % Math.max(1, Math.floor(filtered.length / 5)) === 0; }).map(function (point, index) { var idx = filtered.indexOf(point); return '<text x="' + x(idx).toFixed(1) + '" y="' + (height - 10) + '" text-anchor="middle">' + String(parseDate(point.date).getFullYear()).slice(-2) + '/' + String(parseDate(point.date).getMonth() + 1).padStart(2, '0') + '</text>'; }).join('');
    var target = '<path class="target-line" d="M' + left + ' ' + y(targetLineValue).toFixed(1) + 'H' + (width - right) + '" /><text x="' + (width - right - 10) + '" y="' + (y(targetLineValue) - 5).toFixed(1) + '" text-anchor="end">Fed 2% objective</text>';
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="PCE inflation chart"><line class="grid-line" x1="' + left + '" x2="' + (width - right) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" />' + target + '<path class="pce-line" d="' + path + '" />' + labels + '<text x="' + (left + 4) + '" y="14">PCE</text></svg>';
  }

  function renderCharts() {
    var trend = query('#pce-trend-chart');
    var moment = query('#pce-momentum-chart');
    var longChart = query('#pce-long-chart');
    var pce = data.PCEPI || [];
    var core = data.PCEPILFE || [];
    if (trend) trend.innerHTML = buildChart(pce.slice(range === 'all' ? 0 : -Number(range) * 12), 2);
    if (moment) {
      var monthly = pce.slice(-36).map(function (entry, idx, arr) { if (idx === 0) return null; return { date: entry.date, value: pctChange(entry, arr[idx - 1]) }; }).filter(Boolean);
      moment.innerHTML = monthly.length ? buildChart(monthly, 0) : '<p class="pce-unavailable">No current data available.</p>';
    }
    if (longChart) longChart.innerHTML = buildChart(pce.slice(-120), 2);
  }

  function renderHistory() {
    var body = query('#pce-history-body');
    if (!body) return;
    var rows = (data.PCEPI || []).slice(tableRange === 'all' ? 0 : -Number(tableRange) * 12).reverse();
    body.innerHTML = rows.map(function (entry) {
      var idx = (data.PCEPI || []).findIndex(function (item) { return item.date === entry.date; });
      var yoy = idx >= 12 ? pctChange(entry, (data.PCEPI || [])[idx - 12]) : null;
      var coreEntry = (data.PCEPILFE || []).find(function (item) { return item.date === entry.date; });
      var coreYoy = coreEntry && (data.PCEPILFE || []).findIndex(function (item) { return item.date === coreEntry.date; }) >= 12 ? pctChange(coreEntry, (data.PCEPILFE || []).find(function (item) { return item.date === entry.date; })) : null;
      return '<tr><th scope="row">' + dateLabel(entry.date) + '</th><td>' + formatPercent(yoy, 2) + '</td><td>' + formatPercent(coreYoy, 2) + '</td><td>' + formatPercent((idx > 0 ? pctChange(entry, (data.PCEPI || [])[idx - 1]) : null), 2) + '</td><td>' + formatPercent((coreEntry && (data.PCEPILFE || []).findIndex(function (item) { return item.date === coreEntry.date; }) > 0 ? pctChange(coreEntry, (data.PCEPILFE || [])[Math.max(0, (data.PCEPILFE || []).findIndex(function (item) { return item.date === coreEntry.date; }) - 1)]) : null), 2) + '</td></tr>';
    }).join('') || '<tr><td colspan="5">No current data available.</td></tr>';
  }

  function renderMarketFallback() {
    queryAll('[data-pce-symbol]').forEach(function (card) {
      var strong = card.querySelector('strong');
      var small = card.querySelector('small');
      if (strong) strong.textContent = 'Data unavailable';
      if (small) small.textContent = 'Existing exMarkets quote provider unavailable';
    });
  }

  function loadMarkets() {
    fetch(MARKET_ENDPOINT + '?symbols=USDIndex,XAUUSD,EURUSD,BTCUSD', { headers: { Accept: 'application/json' } }).then(function (response) { if (!response.ok) throw new Error('Market quote request failed'); return response.json(); }).then(function (quotes) { var map = {}; (Array.isArray(quotes) ? quotes : []).forEach(function (quote) { map[quote.id] = quote; }); queryAll('[data-pce-symbol]').forEach(function (card) { var symbol = card.getAttribute('data-pce-symbol'); var quote = map[symbol]; if (!quote || quote.price == null) { card.querySelector('strong').textContent = 'Data unavailable'; card.querySelector('small').textContent = 'No verified quote returned'; return; } card.querySelector('strong').textContent = Number(quote.price).toLocaleString(undefined, { maximumFractionDigits: 5 }); card.querySelector('small').textContent = 'Daily change: ' + (quote.changePercent == null ? 'unavailable' : Number(quote.changePercent).toFixed(2) + '%') + ' | Updated: ' + new Date(quote.timestamp).toLocaleString(); }); }).catch(renderMarketFallback);
  }

  function loadData() {
    fetch(FRED_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ seriesid: ['PCEPI', 'PCEPILFE', 'PCE', 'DSPI', 'DPCERL1Q225SBEA', 'A191RL1Q225SBEA'] })
    }).then(function (response) { if (!response.ok) throw new Error('PCE data request failed'); return response.json(); }).then(function (payload) {
      if (!payload || payload.status !== 'REQUEST_SUCCEEDED') throw new Error('FRED PCE series unavailable');
      var seriesMap = {};
      (payload.series || []).forEach(function (entry) { seriesMap[entry.id] = seriesToArray(entry.data); });
      data.PCEPI = seriesMap.PCEPI || [];
      data.PCEPILFE = seriesMap.PCEPILFE || [];
      data.PCE = seriesMap.PCE || [];
      data.DSPI = seriesMap.DSPI || [];
      data.DPCERL1Q225SBEA = seriesMap.DPCERL1Q225SBEA || [];
      data.A191RL1Q225SBEA = seriesMap.A191RL1Q225SBEA || [];
      if (!data.PCEPI.length) throw new Error('PCEPI series unavailable');
      renderSnapshot();
      renderCharts();
      renderHistory();
    }).catch(function (error) {
      setText('[data-pce-status]', 'PCE data could not be retrieved.');
      if (query('#pce-trend-chart')) query('#pce-trend-chart').innerHTML = '<p class="pce-unavailable">No current PCE data available.</p>';
      if (query('#pce-momentum-chart')) query('#pce-momentum-chart').innerHTML = '<p class="pce-unavailable">No current PCE data available.</p>';
    });
  }

  queryAll('[data-pce-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      range = button.getAttribute('data-pce-range');
      queryAll('[data-pce-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); });
      renderCharts();
    });
  });

  queryAll('[data-pce-table-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      tableRange = button.getAttribute('data-pce-table-range');
      queryAll('[data-pce-table-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); });
      renderHistory();
    });
  });

  loadData();
  loadMarkets();
})();
