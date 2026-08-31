(function () {
  'use strict';

  var ENDPOINT = '/.netlify/functions/gdp-data';
  var state = { data: {}, chartRange: '10Y' };

  function query(selector) { return document.querySelector(selector); }
  function queryAll(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function setText(selector, value) {
    var node = query(selector);
    if (node) node.textContent = value;
  }
  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }
  function percent(value, digits) {
    if (!isFiniteNumber(value)) return 'Data currently unavailable';
    return (value >= 0 ? '+' : '') + Number(value).toFixed(digits) + '%';
  }
  function signedNumber(value, digits) {
    if (!isFiniteNumber(value)) return 'Data currently unavailable';
    return (value >= 0 ? '+' : '') + Number(value).toFixed(digits);
  }
  function parseDate(value) {
    if (!value) return null;
    var date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }
  function toLabel(dateString) {
    var date = parseDate(dateString);
    if (!date) return 'Data currently unavailable';
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  }
  function quarterLabel(dateString) {
    var date = parseDate(dateString);
    if (!date) return 'Data currently unavailable';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }
  function avg(values) {
    if (!values.length) return null;
    var total = values.reduce(function (sum, value) { return sum + value; }, 0);
    return total / values.length;
  }
  function seriesToArray(series) {
    return (series || []).map(function (item) {
      var value = Number(item.value);
      if (!Number.isFinite(value)) return null;
      return { date: item.date, value: value };
    }).filter(Boolean);
  }
  function latestValue(seriesId) {
    var list = state.data[seriesId] || [];
    return list.length ? list[list.length - 1] : null;
  }
  function previousValue(seriesId) {
    var list = state.data[seriesId] || [];
    return list.length > 1 ? list[list.length - 2] : null;
  }
  function pctChange(current, previous) {
    if (!current || !previous || !isFiniteNumber(previous.value) || previous.value === 0) return null;
    return ((current.value / previous.value) - 1) * 100;
  }
  function quarterFromDate(dateString) {
    var date = parseDate(dateString);
    if (!date) return 'Data currently unavailable';
    var quarter = Math.floor(date.getMonth() / 3) + 1;
    return 'Q' + quarter + ' ' + date.getFullYear();
  }
  function renderSnapshot() {
    var realGrowth = latestValue('A191RL1Q225SBEA');
    var priorGrowth = previousValue('A191RL1Q225SBEA');
    var realGDP = latestValue('GDPC1');
    var nominalGDP = latestValue('GDP');
    var priceIndex = latestValue('GDPDEF');
    var estimateType = realGrowth && realGrowth.date ? 'Advance Estimate' : 'Data currently unavailable';

    setText('[data-gdp="real-growth"]', realGrowth ? percent(realGrowth.value, 1) : 'Data currently unavailable');
    setText('[data-gdp="previous-growth"]', priorGrowth ? percent(priorGrowth.value, 1) : 'Data currently unavailable');
    setText('[data-gdp="estimate-type"]', estimateType);
    setText('[data-gdp="revision"]', 'Data currently unavailable');
    setText('[data-gdp="price-index"]', priceIndex ? Number(priceIndex.value).toFixed(2) : 'Data currently unavailable');
    setText('[data-gdp="consumption"]', 'Data currently unavailable');
    setText('[data-gdp="real-gdp"]', realGDP ? Number(realGDP.value).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' bn' : 'Data currently unavailable');
    setText('[data-gdp="release-label"]', realGrowth && realGrowth.date ? quarterFromDate(realGrowth.date) : 'Data currently unavailable');

    setText('[data-gdp-status]', realGrowth ? 'Latest GDP reading: ' + percent(realGrowth.value, 1) + ' for ' + quarterFromDate(realGrowth.date) + '.' : 'GDP data could not be retrieved.');
    setText('[data-gdp="latest-quarter"]', realGrowth ? quarterFromDate(realGrowth.date) : 'Data currently unavailable');
    setText('[data-gdp="latest-estimate"]', estimateType);
    setText('[data-gdp="latest-date"]', realGrowth && realGrowth.date ? new Date(realGrowth.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Data currently unavailable');
    setText('[data-gdp="latest-growth"]', realGrowth ? percent(realGrowth.value, 1) : 'Data currently unavailable');
    setText('[data-gdp="previous-estimate"]', priorGrowth ? percent(priorGrowth.value, 1) : 'Data currently unavailable');
    setText('[data-gdp="latest-revision"]', 'Data currently unavailable');
    setText('[data-gdp="latest-price-index"]', priceIndex ? 'Index ' + Number(priceIndex.value).toFixed(2) : 'Data currently unavailable');
    setText('[data-gdp="latest-consumption"]', 'Data currently unavailable');
    setText('[data-gdp="latest-investment"]', 'Data currently unavailable');
    setText('[data-gdp="latest-government"]', 'Data currently unavailable');
    setText('[data-gdp="latest-exports"]', 'Data currently unavailable');
    setText('[data-gdp="latest-imports"]', 'Data currently unavailable');
    setText('[data-gdp="latest-inventories"]', 'Data currently unavailable');

    setText('[data-gdp="component-consumption"]', 'Data currently unavailable');
    setText('[data-gdp="component-investment"]', 'Data currently unavailable');
    setText('[data-gdp="component-residential"]', 'Data currently unavailable');
    setText('[data-gdp="component-government"]', 'Data currently unavailable');
    setText('[data-gdp="component-exports"]', 'Data currently unavailable');
    setText('[data-gdp="component-imports"]', 'Data currently unavailable');
    setText('[data-gdp="component-inventories"]', 'Data currently unavailable');
    setText('[data-gdp="component-consumption-dir"]', 'Direction unavailable');
    setText('[data-gdp="component-investment-dir"]', 'Direction unavailable');
    setText('[data-gdp="component-residential-dir"]', 'Direction unavailable');
    setText('[data-gdp="component-government-dir"]', 'Direction unavailable');
    setText('[data-gdp="component-exports-dir"]', 'Direction unavailable');
    setText('[data-gdp="component-imports-dir"]', 'Direction unavailable');
    setText('[data-gdp="component-inventories-dir"]', 'Direction unavailable');

    setText('[data-gdp="labor-growth"]', realGrowth ? percent(realGrowth.value, 1) : 'Data currently unavailable');
    setText('[data-gdp="analysis-growth"]', realGrowth ? percent(realGrowth.value, 1) : 'Data currently unavailable');
    setText('[data-gdp="analysis-pce"]', 'Data currently unavailable');
    setText('[data-gdp="analysis-core-pce"]', 'Data currently unavailable');

    setText('[data-gdp="price-latest"]', priceIndex ? 'Index ' + Number(priceIndex.value).toFixed(2) : 'Data currently unavailable');
    setText('[data-gdp="price-previous"]', 'Data currently unavailable');
    setText('[data-gdp="price-level"]', priceIndex ? Number(priceIndex.value).toFixed(2) : 'Data currently unavailable');
    setText('[data-gdp="dash-consumption"]', 'Data currently unavailable');
    setText('[data-gdp="dash-investment"]', 'Data currently unavailable');
    setText('[data-gdp="dash-residential"]', 'Data currently unavailable');
    setText('[data-gdp="dash-government"]', 'Data currently unavailable');
    setText('[data-gdp="dash-exports"]', 'Data currently unavailable');
    setText('[data-gdp="dash-imports"]', 'Data currently unavailable');
    setText('[data-gdp="dash-net-exports"]', 'Data currently unavailable');
    setText('[data-gdp="dash-inventories"]', 'Data currently unavailable');

    if (nominalGDP) {
      setText('[data-gdp="real-gdp"]', Number(realGDP ? realGDP.value : nominalGDP.value).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' bn');
    }
  }

  function buildLineChart(series, options) {
    if (!series || !series.length) return '<p class="gdp-unavailable">Data currently unavailable.</p>';

    var width = 860;
    var height = 240;
    var left = 48;
    var right = 18;
    var top = 18;
    var bottom = 30;
    var values = series.map(function (item) { return item.value; });
    var min = Math.min(0, Math.min.apply(Math, values));
    var max = Math.max(5, Math.max.apply(Math, values));
    var x = function (index) { return left + (index * (width - left - right)) / Math.max(1, series.length - 1); };
    var y = function (value) { return top + ((max - value) * (height - top - bottom)) / Math.max(1, max - min); };

    var points = series.map(function (item, index) {
      return x(index).toFixed(1) + ',' + y(item.value).toFixed(1);
    }).join(' ');
    var area = 'M ' + x(0).toFixed(1) + ' ' + y(0).toFixed(1) + ' L ' + series.map(function (item, index) { return x(index).toFixed(1) + ' ' + y(item.value).toFixed(1); }).join(' L ') + ' L ' + x(series.length - 1).toFixed(1) + ' ' + (height - bottom).toFixed(1) + ' L ' + x(0).toFixed(1) + ' ' + (height - bottom).toFixed(1) + ' Z';
    var labels = series.filter(function (_, index) { return index === 0 || index === series.length - 1 || index % Math.max(1, Math.floor(series.length / 5)) === 0; }).map(function (item, index) {
      var idx = series.indexOf(item);
      var label = (idx === 0 || idx === series.length - 1) ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { year: '2-digit', month: 'short' }) : new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      return '<text class="gdp-axis-label" x="' + x(idx).toFixed(1) + '" y="' + (height - 8) + '" text-anchor="middle">' + label + '</text>';
    }).join('');

    return '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="GDP chart"><path class="gdp-fill" d="' + area + '" /><path class="gdp-line" d="M ' + points.replace(/ /g, ' L ') + '" /><line class="grid-line" x1="' + left + '" x2="' + (width - right) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" />' + labels + '</svg>';
  }

  function renderGrowthChart() {
    var chart = query('#gdp-growth-chart');
    if (!chart) return;
    var series = state.data.A191RL1Q225SBEA || [];
    if (!series.length) {
      chart.innerHTML = '<p class="gdp-unavailable">Data currently unavailable.</p>';
      return;
    }
    var view = series.slice(-120);
    chart.innerHTML = buildLineChart(view);
  }

  function renderLevelChart() {
    var chart = query('#gdp-level-chart');
    if (!chart) return;
    var real = state.data.GDPC1 || [];
    var nominal = state.data.GDP || [];
    var series = real.length && nominal.length ? real.slice(-60).map(function (point) {
      var match = nominal.find(function (item) { return item.date === point.date; });
      return match ? { date: point.date, value: point.value } : null;
    }).filter(Boolean) : [];
    chart.innerHTML = series.length ? buildLineChart(series) : '<p class="gdp-unavailable">Data currently unavailable.</p>';
  }

  function renderHistory() {
    var body = query('#gdp-history-body');
    if (!body) return;
    var growth = state.data.A191RL1Q225SBEA || [];
    if (!growth.length) {
      body.innerHTML = '<tr><td colspan="5">Data currently unavailable.</td></tr>';
      return;
    }
    var rows = growth.slice(-12).reverse().map(function (item) {
      return '<tr><th scope="row">' + quarterFromDate(item.date) + '</th><td>' + (item.value ? percent(item.value, 1) : 'Data currently unavailable') + '</td><td>Data currently unavailable</td><td>Data currently unavailable</td><td>' + (item.value ? percent(item.value, 1) : 'Data currently unavailable') + '</td></tr>';
    }).join('');
    body.innerHTML = rows || '<tr><td colspan="5">Data currently unavailable.</td></tr>';
  }

  function renderCalendar(schedule) {
    var body = query('#gdp-calendar-body');
    if (!body) return;
    if (!schedule || !schedule.length) {
      body.innerHTML = '<tr><td colspan="4">Data currently unavailable.</td></tr>';
      return;
    }
    body.innerHTML = schedule.slice(0, 6).map(function (item) {
      return '<tr><th scope="row">' + (item.type || 'GDP') + '</th><td>' + (item.quarter || 'Data currently unavailable') + '</td><td>' + (item.date || 'Data currently unavailable') + '</td><td>' + (item.time || 'Data currently unavailable') + '</td></tr>';
    }).join('');
  }

  function renderRevisions() {
    var body = query('#gdp-revision-body');
    if (!body) return;
    var growth = state.data.A191RL1Q225SBEA || [];
    if (!growth.length) {
      body.innerHTML = '<tr><td colspan="4">Data currently unavailable.</td></tr>';
      return;
    }
    body.innerHTML = growth.slice(-6).reverse().map(function (item) {
      return '<tr><th scope="row">' + quarterFromDate(item.date) + '</th><td>Data currently unavailable</td><td>' + (item.value ? percent(item.value, 1) : 'Data currently unavailable') + '</td><td>Data currently unavailable</td></tr>';
    }).join('');
  }

  function updateCountdown(schedule) {
    var next = schedule && schedule[0];
    if (!next) {
      setText('[data-gdp="next-release-type"]', 'Data currently unavailable');
      setText('[data-gdp="next-quarter"]', 'Data currently unavailable');
      setText('[data-gdp="next-date"]', 'Data currently unavailable');
      setText('[data-gdp="next-time"]', 'Data currently unavailable');
      setText('[data-gdp="countdown"]', 'Official BEA GDP release schedule unavailable.');
      return;
    }
    var target = new Date(next.dateTime || next.date + 'T' + (next.time || '08:30:00'));
    setText('[data-gdp="next-release-type"]', next.type || 'GDP');
    setText('[data-gdp="next-quarter"]', next.quarter || 'Data currently unavailable');
    setText('[data-gdp="next-date"]', next.date || 'Data currently unavailable');
    setText('[data-gdp="next-time"]', next.time || 'Data currently unavailable');

    var countdown = query('[data-gdp="countdown"]');
    if (countdown) {
      var tick = function () {
        var now = new Date();
        var diff = target.getTime() - now.getTime();
        if (diff <= 0) {
          countdown.textContent = 'Release in progress or scheduled update pending.';
          return;
        }
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        var minutes = Math.floor((diff / (1000 * 60)) % 60);
        var seconds = Math.floor((diff / 1000) % 60);
        countdown.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's until release (ET)';
      };
      tick();
      window.setInterval(tick, 1000);
    }
  }

  function loadSchedule() {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'release-schedule' })
    }).then(function (response) { if (!response.ok) throw new Error('release schedule failed'); return response.json(); }).then(function (payload) {
      if (!payload || !payload.schedule) throw new Error('no schedule');
      renderCalendar(payload.schedule);
      updateCountdown(payload.schedule);
    }).catch(function () {
      renderCalendar([]);
      updateCountdown([]);
    });
  }

  function loadData() {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        seriesid: ['GDPC1', 'GDP', 'GDPDEF', 'A191RL1Q225SBEA', 'GPDIC1', 'GCEC1', 'A822RL1Q225SBEA']
      })
    }).then(function (response) { if (!response.ok) throw new Error('GDP data request failed'); return response.json(); }).then(function (payload) {
      if (!payload || payload.status !== 'REQUEST_SUCCEEDED') throw new Error('GDP series unavailable');
      var map = {};
      (payload.series || []).forEach(function (item) { map[item.id] = seriesToArray(item.data); });
      state.data = map;
      renderSnapshot();
      renderGrowthChart();
      renderLevelChart();
      renderHistory();
      renderRevisions();
    }).catch(function () {
      setText('[data-gdp-status]', 'GDP data could not be retrieved.');
      query('#gdp-growth-chart').innerHTML = '<p class="gdp-unavailable">Data currently unavailable.</p>';
    });
  }

  queryAll('[data-gdp-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.chartRange = button.getAttribute('data-gdp-range');
      queryAll('[data-gdp-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); });
      renderGrowthChart();
    });
  });

  loadData();
  loadSchedule();
})();
