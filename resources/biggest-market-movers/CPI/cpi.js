(function () {
  'use strict';

  var BLS_ENDPOINT = '/.netlify/functions/cpi-data';
  var MARKET_ENDPOINT = 'https://exmarkets.netlify.app/.netlify/functions/market-data';
  var SERIES = {
    headline: 'CUUR0000SA0',
    core: 'CUSR0000SA0L1E',
    shelter: 'CUSR0000SAH1',
    food: 'CUSR0000SAF1',
    energy: 'CUSR0000SAE1',
    transportation: 'CUSR0000SAT1',
    medical: 'CUSR0000SAM1',
    'used-cars': 'CUSR0000SEAU'
  };
  var seriesData = {};
  var chartRange = 1;
  var tableRange = 1;
  var now = new Date();
  var startYear = now.getUTCFullYear() - 10;

  function query(selector) { return document.querySelector(selector); }
  function queryAll(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function setText(selector, value) { var element = query(selector); if (element) element.textContent = value; }
  function escapeXml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function observationKey(item) { return item.year + '-' + item.periodName; }
  function isMonth(item) { return /^M(0[1-9]|1[0-2])$/.test(item.period); }
  function parseValue(item) { var value = Number(item.value); return Number.isFinite(value) ? value : null; }
  function normalizeObservations(items) {
    return (items || []).filter(isMonth).map(function (item) { return { year: Number(item.year), month: Number(item.period.slice(1)), periodName: item.periodName, value: parseValue(item) }; }).filter(function (item) { return item.value !== null; }).sort(function (a, b) { return a.year - b.year || a.month - b.month; });
  }

  function periodLabel(item) { return item ? item.periodName + ' ' + item.year : 'Latest available'; }
  function rate(current, previous) { return current && previous ? ((current.value / previous.value) - 1) * 100 : null; }
  function formatRate(value) { return value === null || !Number.isFinite(value) ? 'Data unavailable' : (value >= 0 ? '+' : '') + value.toFixed(1) + '%'; }
  function formatYoY(value) { return value === null || !Number.isFinite(value) ? 'Data unavailable' : (value >= 0 ? '+' : '') + value.toFixed(1) + '%'; }
  function latestPair(key) { var items = seriesData[key] || []; return { current: items[items.length - 1], previous: items[items.length - 2], yearAgo: items.length > 12 ? items[items.length - 13] : null }; }
  function setPeriod(key, value) { queryAll('[data-cpi-period="' + key + '"]').forEach(function (element) { element.textContent = value ? '(' + periodLabel(value) + ')' : ''; }); }

  function updateSnapshot() {
    var headline = latestPair('headline');
    var core = latestPair('core');
    var headlineYoY = rate(headline.current, headline.yearAgo);
    var coreYoY = rate(core.current, core.yearAgo);
    var headlineMoM = rate(headline.current, headline.previous);
    var coreMoM = rate(core.current, core.previous);
    setText('[data-cpi="headline-yoy"]', formatYoY(headlineYoY));
    setText('[data-cpi="core-yoy"]', formatYoY(coreYoY));
    setText('[data-cpi="headline-mom"]', formatRate(headlineMoM));
    setText('[data-cpi="core-mom"]', formatRate(coreMoM));
    setText('[data-cpi="previous-headline"]', formatYoY(rate(headline.previous, headline.previous && seriesData.headline[seriesData.headline.length - 14])));
    setText('[data-cpi="previous-core"]', formatYoY(rate(core.previous, core.previous && seriesData.core[seriesData.core.length - 14])));
    setPeriod('headline-yoy', headline.current);
    setPeriod('core-yoy', core.current);
    setPeriod('headline-mom', headline.current);
    setPeriod('core-mom', core.current);
    setText('[data-cpi="release-date"]', 'Data unavailable');
    setText('[data-cpi="headline-yoy-copy"]', formatYoY(headlineYoY));
    setText('[data-cpi="core-yoy-copy"]', formatYoY(coreYoY));
    setText('[data-cpi="headline-mom-copy"]', formatRate(headlineMoM));
    setText('[data-cpi="core-mom-copy"]', formatRate(coreMoM));
    setText('[data-cpi-status]', 'Latest available BLS index period: ' + periodLabel(headline.current) + '. Release date is supplied by the official BLS release calendar.');
  }

  function updateComponents() {
    Object.keys(SERIES).filter(function (key) { return key !== 'headline' && key !== 'core'; }).forEach(function (key) {
      var pair = latestPair(key);
      setText('[data-component="' + key + '"]', formatRate(rate(pair.current, pair.previous)));
      setText('[data-component-period="' + key + '"]', pair.current ? 'MoM: ' + periodLabel(pair.current) + ' | Source: BLS' : 'Source: BLS');
      setText('[data-component-yoy="' + key + '"]', formatYoY(rate(pair.current, pair.yearAgo)));
    });
  }

  function pointsFor(key, months) {
    var items = seriesData[key] || [];
    return months === 'all' ? items : items.slice(-Number(months) * 12);
  }

  function chartSvg(headline, core, monthly) {
    var width = 900;
    var height = 270;
    var left = 48;
    var right = 18;
    var top = 18;
    var bottom = 35;
    var allValues = headline.concat(core).map(function (item) { return monthly ? rate(item, null) : item.value; }).filter(function (value) { return value !== null && Number.isFinite(value); });
    if (!allValues.length) return '<p class="cpi-unavailable">No current data available.</p>';
    if (monthly) {
      allValues = headline.map(function (item, index) { return rate(item, headline[index - 1]); }).concat(core.map(function (item, index) { return rate(item, core[index - 1]); })).filter(function (value) { return value !== null; });
    }
    var min = monthly ? Math.min(-1, Math.min.apply(Math, allValues)) : Math.min(0, Math.min.apply(Math, allValues));
    var max = Math.max(monthly ? 1 : 2, Math.max.apply(Math, allValues));
    var x = function (index, length) { return left + index * ((width - left - right) / Math.max(1, length - 1)); };
    var y = function (value) { return top + (max - value) * ((height - top - bottom) / (max - min)); };
    function path(items, className) {
      var values = items.map(function (item, index) { return { value: monthly ? rate(item, items[index - 1]) : item.value, item: item }; }).filter(function (point) { return point.value !== null && Number.isFinite(point.value); });
      return '<path class="' + className + '" d="' + values.map(function (point, index) { return (index ? 'L' : 'M') + x(items.indexOf(point.item), items.length).toFixed(1) + ' ' + y(point.value).toFixed(1); }).join(' ') + '" />';
    }
    var labels = headline.filter(function (_, index) { return index === 0 || index === headline.length - 1 || index % Math.max(1, Math.floor(headline.length / 5)) === 0; }).map(function (item) { var index = headline.indexOf(item); return '<text x="' + x(index, headline.length).toFixed(1) + '" y="' + (height - 10) + '" text-anchor="middle">' + escapeXml(String(item.year).slice(-2) + '/' + String(item.month).padStart(2, '0')) + '</text>'; }).join('');
    var target = monthly ? '' : '<path class="target-line" d="M' + left + ' ' + y(2).toFixed(1) + 'H' + (width - right) + '" /><text x="' + (width - right - 4) + '" y="' + (y(2) - 5).toFixed(1) + '" text-anchor="end">Fed 2% goal</text>';
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + (monthly ? 'Monthly CPI momentum' : 'Headline and core CPI year over year') + '"><line class="grid-line" x1="' + left + '" x2="' + (width - right) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" />' + target + path(headline, 'headline-line') + path(core, 'core-line') + labels + '<text x="' + (left + 4) + '" y="14">Headline CPI</text><text x="' + (left + 90) + '" y="14">Core CPI</text></svg>';
  }

  function renderCharts() {
    var headline = pointsFor('headline', chartRange);
    var core = pointsFor('core', chartRange);
    var chart = query('#cpi-trend-chart');
    var momentum = query('#cpi-momentum-chart');
    if (chart) chart.innerHTML = chartSvg(headline, core, false);
    if (momentum) momentum.innerHTML = chartSvg(headline, core, true);
  }

  function renderHistory() {
    var body = query('#cpi-history-body');
    if (!body) return;
    var headline = pointsFor('headline', tableRange);
    var core = pointsFor('core', tableRange);
    var rows = headline.slice().reverse().map(function (item) {
      var index = headline.indexOf(item);
      var coreItem = core.filter(function (candidate) { return candidate.year === item.year && candidate.month === item.month; })[0];
      return '<tr><th scope="row">' + escapeXml(periodLabel(item)) + '</th><td>' + formatYoY(rate(item, headline[index - 12])) + '</td><td>' + formatYoY(coreItem ? rate(coreItem, core[core.indexOf(coreItem) - 12]) : null) + '</td><td>' + formatRate(rate(item, headline[index - 1])) + '</td><td>' + formatRate(coreItem ? rate(coreItem, core[core.indexOf(coreItem) - 1]) : null) + '</td></tr>';
    });
    body.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">No current data available.</td></tr>';
  }

  function renderMarketUnavailable() { queryAll('[data-cpi-symbol]').forEach(function (card) { card.querySelector('strong').textContent = 'Data unavailable'; card.querySelector('small').textContent = 'Existing exMarkets quote provider unavailable'; }); }
  function loadMarkets() {
    fetch(MARKET_ENDPOINT + '?symbols=USDIndex,XAUUSD,EURUSD,BTCUSD', { headers: { Accept: 'application/json' } }).then(function (response) { if (!response.ok) throw new Error('Market quote request failed'); return response.json(); }).then(function (quotes) { var map = {}; (Array.isArray(quotes) ? quotes : []).forEach(function (quote) { map[quote.id] = quote; }); queryAll('[data-cpi-symbol]').forEach(function (card) { var quote = map[card.getAttribute('data-cpi-symbol')]; if (!quote || quote.price == null) { card.querySelector('strong').textContent = 'Data unavailable'; card.querySelector('small').textContent = 'No verified quote returned'; return; } card.querySelector('strong').textContent = Number(quote.price).toLocaleString(undefined, { maximumFractionDigits: 5 }); card.querySelector('small').textContent = 'Daily change: ' + (quote.changePercent == null ? 'unavailable' : Number(quote.changePercent).toFixed(2) + '%') + ' | Updated: ' + new Date(quote.timestamp).toLocaleString(); }); }).catch(renderMarketUnavailable);
  }

  function loadBls() {
    var ids = Object.keys(SERIES).map(function (key) { return SERIES[key]; });
    fetch(BLS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ seriesid: ids, startyear: String(startYear), endyear: String(now.getUTCFullYear()) }) }).then(function (response) { if (!response.ok) throw new Error('BLS request failed'); return response.json(); }).then(function (payload) { if (!payload || payload.status !== 'REQUEST_SUCCEEDED') throw new Error('BLS data unavailable'); var bySeries = {}; (payload.Results && payload.Results.series || []).forEach(function (series) { bySeries[series.seriesID] = normalizeObservations(series.data); }); Object.keys(SERIES).forEach(function (key) { seriesData[key] = bySeries[SERIES[key]] || []; }); if (!seriesData.headline.length || !seriesData.core.length) throw new Error('Required CPI series unavailable'); updateSnapshot(); updateComponents(); renderCharts(); renderHistory(); }).catch(function () { setText('[data-cpi-status]', 'CPI data could not be retrieved. Official BLS data is currently unavailable.'); setText('#cpi-trend-chart', 'No current data available.'); setText('#cpi-momentum-chart', 'No current data available.'); });
  }

  queryAll('[data-cpi-range]').forEach(function (button) { button.addEventListener('click', function () { chartRange = button.getAttribute('data-cpi-range'); queryAll('[data-cpi-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); }); renderCharts(); }); });
  queryAll('[data-cpi-table-range]').forEach(function (button) { button.addEventListener('click', function () { tableRange = button.getAttribute('data-cpi-table-range'); queryAll('[data-cpi-table-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); }); renderHistory(); }); });
  loadBls();
  loadMarkets();
})();
