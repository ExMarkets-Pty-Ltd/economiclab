(function () {
  'use strict';

  var BLS_ENDPOINT = '/.netlify/functions/cpi-data';
  var MARKET_ENDPOINT = 'https://exmarkets.netlify.app/.netlify/functions/market-data';
  var SERIES = {
    payrolls: 'CES0000000001',
    privatePayrolls: 'CES0500000001',
    hourlyEarnings: 'CES0500000003',
    weeklyHours: 'CES0500000002',
    unemployment: 'LNS14000000',
    participation: 'LNS11300000',
    employmentPopulation: 'LNS12300000',
    health: 'CES6562000001',
    government: 'CES9000000001',
    professional: 'CES5400000001',
    leisure: 'CES7000000001',
    retail: 'CES4200000001',
    manufacturing: 'CES3000000001',
    construction: 'CES2000000001',
    transportation: 'CES4300000001'
  };
  var data = {};
  var range = 1;
  var now = new Date();
  var startYear = now.getUTCFullYear() - 10;

  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function set(selector, value) { var element = document.querySelector(selector); if (element) element.textContent = value; }
  function month(item) { return item && item.period && /^M(0[1-9]|1[0-2])$/.test(item.period); }
  function normalize(items) { return (items || []).filter(month).map(function (item) { return { year: Number(item.year), month: Number(item.period.slice(1)), periodName: item.periodName, value: Number(item.value) }; }).filter(function (item) { return Number.isFinite(item.value); }).sort(function (a, b) { return a.year - b.year || a.month - b.month; }); }
  function period(item) { return item ? item.periodName + ' ' + item.year : 'Latest available'; }
  function latest(key) { var values = data[key] || []; return { current: values[values.length - 1], previous: values[values.length - 2], before: values[values.length - 3] }; }
  function delta(current, previous) { return current && previous ? current.value - previous.value : null; }
  function percent(current, previous) { return current && previous && previous.value !== 0 ? ((current.value / previous.value) - 1) * 100 : null; }
  function signed(value, decimals) { return value === null || !Number.isFinite(value) ? 'Data unavailable' : (value >= 0 ? '+' : '') + value.toFixed(decimals); }
  function payroll(value) { return value === null || !Number.isFinite(value) ? 'Data unavailable' : (value >= 0 ? '+' : '') + Math.round(value).toLocaleString() + ',000'; }
  function rate(value) { return value === null || !Number.isFinite(value) ? 'Data unavailable' : value.toFixed(1) + '%'; }
  function setPeriods(key, value) { all('[data-nfp-period="' + key + '"]').forEach(function (element) { element.textContent = value ? period(value) : 'Latest available'; }); }

  function updateSnapshot() {
    var jobs = latest('payrolls');
    var privateJobs = latest('privatePayrolls');
    var wages = latest('hourlyEarnings');
    var hours = latest('weeklyHours');
    var unemployment = latest('unemployment');
    var participation = latest('participation');
    var employmentPopulation = latest('employmentPopulation');
    set('[data-nfp="payroll-change"]', payroll(delta(jobs.current, jobs.previous)));
    set('[data-nfp="previous-payroll"]', payroll(delta(jobs.previous, jobs.before)));
    set('[data-nfp="unemployment"]', rate(unemployment.current && unemployment.current.value));
    set('[data-nfp="hourly-earnings"]', signed(percent(wages.current, wages.previous), 2) + ' MoM');
    set('[data-nfp="participation"]', rate(participation.current && participation.current.value));
    set('[data-nfp="employment-population"]', rate(employmentPopulation.current && employmentPopulation.current.value));
    set('[data-nfp="latest-period"]', period(jobs.current));
    set('[data-nfp="hourly-annual"]', signed(percent(wages.current, wages.current && data.hourlyEarnings[data.hourlyEarnings.length - 13]), 2) + ' YoY');
    set('[data-nfp="weekly-hours"]', hours.current ? hours.current.value.toFixed(1) : 'Data unavailable');
    set('[data-nfp="private-payrolls"]', payroll(delta(privateJobs.current, privateJobs.previous)));
    set('[data-nfp="payroll-change-copy"]', payroll(delta(jobs.current, jobs.previous)));
    set('[data-nfp="unemployment-copy"]', rate(unemployment.current && unemployment.current.value));
    set('[data-nfp="participation-copy"]', rate(participation.current && participation.current.value));
    set('[data-nfp="employment-population-copy"]', rate(employmentPopulation.current && employmentPopulation.current.value));
    set('[data-nfp="hourly-earnings-copy"]', wages.current ? wages.current.value.toFixed(2) : 'Data unavailable');
    set('[data-nfp="weekly-hours-copy"]', hours.current ? hours.current.value.toFixed(1) : 'Data unavailable');
    set('[data-nfp-status]', 'Latest available BLS period: ' + period(jobs.current) + '. Release date and revision status require the official BLS release schedule and vintage data.');
  }

  function updateSectors() {
    var keys = ['health', 'government', 'professional', 'leisure', 'retail', 'manufacturing', 'construction', 'transportation'];
    keys.forEach(function (key) { var item = latest(key); var value = delta(item.current, item.previous); set('[data-nfp-sector="' + key + '"] strong', payroll(value)); set('[data-nfp-sector="' + key + '"] small', value === null ? 'BLS CES data unavailable' : period(item.current) + ' | Monthly change'); set('[data-nfp="' + key + '-copy"]', payroll(value)); });
    var ranked = keys.map(function (key) { return { key: key, value: delta(latest(key).current, latest(key).previous) }; }).filter(function (item) { return item.value !== null; }).sort(function (a, b) { return b.value - a.value; });
    if (ranked.length) { set('[data-nfp-gains]', 'Largest calculated gain: ' + ranked[0].key + ' (' + payroll(ranked[0].value) + ')'); set('[data-nfp-losses]', 'Largest calculated loss: ' + ranked[ranked.length - 1].key + ' (' + payroll(ranked[ranked.length - 1].value) + ')'); }
  }

  function chart(key, secondary) {
    var primary = (data[key] || []).slice(-range * 12);
    var other = (data[secondary] || []).slice(-range * 12);
    if (!primary.length || !other.length) return '<p class="nfp-unavailable">No current data available.</p>';
    var width = 900, height = 270, left = 50, right = 18, top = 20, bottom = 35;
    var values = primary.map(function (item, index) { return key === 'payrolls' ? delta(item, primary[index - 1]) : item.value; }).concat(other.map(function (item) { return item.value; })).filter(function (value) { return value !== null && Number.isFinite(value); });
    var min = Math.min(0, Math.min.apply(Math, values)); var max = Math.max(1, Math.max.apply(Math, values));
    var x = function (index) { return left + index * ((width - left - right) / Math.max(1, primary.length - 1)); }; var y = function (value) { return top + (max - value) * ((height - top - bottom) / Math.max(1, max - min)); };
    var first = primary.map(function (item, index) { return { value: key === 'payrolls' ? delta(item, primary[index - 1]) : item.value, index: index }; }).filter(function (item) { return item.value !== null; });
    var second = other.map(function (item) { return item.value; });
    var path = function (values, className) { return '<path class="' + className + '" d="' + values.map(function (value, index) { return (index ? 'L' : 'M') + x(index).toFixed(1) + ' ' + y(value).toFixed(1); }).join(' ') + '" />'; };
    var labels = primary.filter(function (_, index) { return index === 0 || index === primary.length - 1 || index % Math.max(1, Math.floor(primary.length / 5)) === 0; }).map(function (item) { var index = primary.indexOf(item); return '<text x="' + x(index).toFixed(1) + '" y="' + (height - 10) + '" text-anchor="middle">' + String(item.year).slice(-2) + '/' + String(item.month).padStart(2, '0') + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" aria-label="NFP and labor-market chart"><line class="nfp-grid-line" x1="' + left + '" x2="' + (width - right) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" />' + path(first.map(function (item) { return item.value; }), 'nfp-primary-line') + path(second, 'nfp-secondary-line') + labels + '<text x="' + left + '" y="14">' + (key === 'payrolls' ? 'Monthly payroll change' : 'Unemployment rate') + '</text><text x="' + (left + 150) + '" y="14">' + (secondary === 'unemployment' ? 'Unemployment rate' : 'Payroll level') + '</text></svg>';
  }

  function renderCharts() { set('#nfp-trend-chart', ''); var trend = document.querySelector('#nfp-trend-chart'); var unemployment = document.querySelector('#nfp-unemployment-chart'); if (trend) trend.innerHTML = chart('payrolls', 'unemployment'); if (unemployment) unemployment.innerHTML = chart('unemployment', 'participation'); }
  function renderHistory() { var body = document.querySelector('#nfp-history-body'); var jobs = (data.payrolls || []).slice(-range * 12).reverse(); var unemployment = data.unemployment || []; var wages = data.hourlyEarnings || []; if (!body || !jobs.length) return; body.innerHTML = jobs.map(function (item, index) { var jobIndex = data.payrolls.indexOf(item); var u = unemployment.filter(function (candidate) { return candidate.year === item.year && candidate.month === item.month; })[0]; var w = wages.filter(function (candidate) { return candidate.year === item.year && candidate.month === item.month; })[0]; return '<tr><th scope="row">' + period(item) + '</th><td>' + payroll(delta(item, data.payrolls[jobIndex - 1])) + '</td><td>' + rate(u && u.value) + '</td><td>' + (w ? w.value.toFixed(2) : 'Data unavailable') + '</td><td>Latest BLS series</td></tr>'; }).join(''); }
  function marketFallback() { all('[data-nfp-symbol]').forEach(function (card) { card.querySelector('strong').textContent = 'Data unavailable'; card.querySelector('small').textContent = 'Existing exMarkets quote provider unavailable'; }); }
  function loadMarkets() { fetch(MARKET_ENDPOINT + '?symbols=USDIndex,XAUUSD,EURUSD,BTCUSD', { headers: { Accept: 'application/json' } }).then(function (response) { if (!response.ok) throw new Error('Market request failed'); return response.json(); }).then(function (quotes) { var map = {}; (Array.isArray(quotes) ? quotes : []).forEach(function (quote) { map[quote.id] = quote; }); all('[data-nfp-symbol]').forEach(function (card) { var quote = map[card.getAttribute('data-nfp-symbol')]; if (!quote || quote.price == null) throw new Error('Quote unavailable'); card.querySelector('strong').textContent = Number(quote.price).toLocaleString(undefined, { maximumFractionDigits: 5 }); card.querySelector('small').textContent = 'Daily change: ' + (quote.changePercent == null ? 'unavailable' : Number(quote.changePercent).toFixed(2) + '%') + ' | Updated: ' + new Date(quote.timestamp).toLocaleString(); }); }).catch(marketFallback); }
  function loadBls() { var ids = Object.keys(SERIES).map(function (key) { return SERIES[key]; }); fetch(BLS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ seriesid: ids, startyear: String(startYear), endyear: String(now.getUTCFullYear()) }) }).then(function (response) { if (!response.ok) throw new Error('BLS request failed'); return response.json(); }).then(function (payload) { if (payload.status !== 'REQUEST_SUCCEEDED') throw new Error('BLS unavailable'); var byId = {}; (payload.Results.series || []).forEach(function (series) { byId[series.seriesID] = normalize(series.data); }); Object.keys(SERIES).forEach(function (key) { data[key] = byId[SERIES[key]] || []; }); if (!data.payrolls.length) throw new Error('Payroll series unavailable'); updateSnapshot(); updateSectors(); renderCharts(); renderHistory(); }).catch(function () { set('[data-nfp-status]', 'Employment data could not be retrieved. Official BLS data is currently unavailable.'); set('#nfp-trend-chart', 'No current data available.'); set('#nfp-unemployment-chart', 'No current data available.'); }); }
  all('[data-nfp-range]').forEach(function (button) { button.addEventListener('click', function () { range = button.getAttribute('data-nfp-range'); all('[data-nfp-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); }); renderCharts(); renderHistory(); }); });
  all('[data-nfp-table-range]').forEach(function (button) { button.addEventListener('click', function () { range = button.getAttribute('data-nfp-table-range'); all('[data-nfp-table-range]').forEach(function (item) { item.classList.toggle('is-active', item === button); }); renderHistory(); }); });
  loadBls(); loadMarkets();
})();
