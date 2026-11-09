(function () {
  'use strict';

  var BLS_ENDPOINT = '/.netlify/functions/cpi-data';
  var MARKET_ENDPOINT = '/.netlify/functions/market-data';
  var CACHE_KEY = 'economiclab-cpi-series-v1';
  var CACHE_MAX_AGE = 60 * 60 * 1000;
  var REFRESH_INTERVAL = 30 * 60 * 1000;
  var SERIES = {
    headlineNsa: 'CUUR0000SA0',
    headlineSa: 'CUSR0000SA0',
    coreNsa: 'CUUR0000SA0L1E',
    coreSa: 'CUSR0000SA0L1E',
    shelter: 'CUSR0000SAH1',
    food: 'CUSR0000SAF1',
    energy: 'CUSR0000SAE1',
    transportation: 'CUSR0000SAT1',
    medical: 'CUSR0000SAM1',
    'used-cars': 'CUSR0000SETA02'
  };
  var seriesData = {};
  var chartRange = 1;
  var tableRange = 1;
  var requestInFlight = null;

  function query(selector) {
    return document.querySelector(selector);
  }

  function queryAll(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function setText(selector, value) {
    var element = query(selector);
    if (element) element.textContent = value;
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function periodKey(item) {
    return item.year + '-' + String(item.month).padStart(2, '0');
  }

  function periodLabel(item) {
    return item ? item.periodName + ' ' + item.year : 'Unavailable';
  }

  function isMonthlyObservation(item) {
    return item && /^M(0[1-9]|1[0-2])$/.test(item.period);
  }

  function observationValue(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeObservations(items) {
    return (items || [])
      .filter(isMonthlyObservation)
      .map(function (item) {
        return {
          year: Number(item.year),
          month: Number(item.period.slice(1)),
          periodName: item.periodName,
          value: observationValue(item.value)
        };
      })
      .filter(function (item) {
        return Number.isInteger(item.year) &&
          Number.isInteger(item.month);
      })
      .sort(function (a, b) {
        return a.year - b.year || a.month - b.month;
      });
  }

  function percentChange(current, previous) {
    if (!current || !previous ||
      !Number.isFinite(current.value) ||
      !Number.isFinite(previous.value) ||
      previous.value === 0) return null;
    var result = ((current.value / previous.value) - 1) * 100;
    return Number.isFinite(result) ? result : null;
  }

  function changeAt(items, index, monthsBack) {
    return percentChange(items[index], items[index - monthsBack]);
  }

  function formatRate(value) {
    if (value === null || !Number.isFinite(value)) return 'Data unavailable';
    return (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
  }

  function formatDifference(value) {
    if (value === null || !Number.isFinite(value)) return 'N/A';
    return (value >= 0 ? '+' : '') + value.toFixed(1) + ' pp';
  }

  function latestMetric(key, monthsBack) {
    var items = seriesData[key] || [];
    var currentIndex = items.length - 1;
    return {
      current: changeAt(items, currentIndex, monthsBack),
      previous: changeAt(items, currentIndex - 1, monthsBack),
      reference: items[currentIndex]
    };
  }

  function addCardDetails(selector, metric) {
    var value = query(selector);
    var card = value && value.closest('.cpi-data-card');
    if (!card || !metric.reference) return;

    var details = card.querySelector('[data-cpi-details]');
    if (!details) {
      details = document.createElement('small');
      details.setAttribute('data-cpi-details', '');
      card.appendChild(details);
    }

    var difference = metric.current === null || metric.previous === null
      ? null
      : metric.current - metric.previous;
    details.textContent = 'Previous: ' + formatRate(metric.previous) +
      ' | Change: ' + formatDifference(difference) +
      ' | Reference: ' + periodLabel(metric.reference) +
      ' | Release date: unavailable';
  }

  function updateSnapshot() {
    var headlineYoY = latestMetric('headlineNsa', 12);
    var coreYoY = latestMetric('coreNsa', 12);
    var headlineMoM = latestMetric('headlineSa', 1);
    var coreMoM = latestMetric('coreSa', 1);

    setText('[data-cpi="headline-yoy"]', formatRate(headlineYoY.current));
    setText('[data-cpi="core-yoy"]', formatRate(coreYoY.current));
    setText('[data-cpi="headline-mom"]', formatRate(headlineMoM.current));
    setText('[data-cpi="core-mom"]', formatRate(coreMoM.current));
    setText('[data-cpi="previous-headline"]', formatRate(headlineYoY.previous));
    setText('[data-cpi="previous-core"]', formatRate(coreYoY.previous));
    setText('[data-cpi="release-date"]', 'Unavailable');

    [
      ['[data-cpi="headline-yoy"]', headlineYoY],
      ['[data-cpi="core-yoy"]', coreYoY],
      ['[data-cpi="headline-mom"]', headlineMoM],
      ['[data-cpi="core-mom"]', coreMoM]
    ].forEach(function (entry) {
      addCardDetails(entry[0], entry[1]);
    });

    [
      ['headline-yoy', headlineYoY.reference],
      ['core-yoy', coreYoY.reference],
      ['headline-mom', headlineMoM.reference],
      ['core-mom', coreMoM.reference]
    ].forEach(function (entry) {
      queryAll('[data-cpi-period="' + entry[0] + '"]').forEach(function (element) {
        element.textContent = entry[1] ? '(' + periodLabel(entry[1]) + ')' : '';
      });
    });

    setText('[data-cpi="headline-yoy-copy"]', formatRate(headlineYoY.current));
    setText('[data-cpi="core-yoy-copy"]', formatRate(coreYoY.current));
    setText('[data-cpi="headline-mom-copy"]', formatRate(headlineMoM.current));
    setText('[data-cpi="core-mom-copy"]', formatRate(coreMoM.current));
  }

  function updateComponents() {
    Object.keys(SERIES).filter(function (key) {
      return ['headlineNsa', 'headlineSa', 'coreNsa', 'coreSa'].indexOf(key) === -1;
    }).forEach(function (key) {
      var items = seriesData[key] || [];
      var latestIndex = items.length - 1;
      var monthChange = changeAt(items, latestIndex, 1);
      var yearChange = changeAt(items, latestIndex, 12);
      var reference = items[latestIndex];
      setText('[data-component="' + key + '"]', formatRate(monthChange));
      setText(
        '[data-component-period="' + key + '"]',
        reference ? 'MoM: ' + periodLabel(reference) + ' | Source: BLS' : 'Source: BLS'
      );
      setText('[data-component-yoy="' + key + '"]', formatRate(yearChange));
    });
  }

  function ratePoints(key, monthsBack, range) {
    var items = seriesData[key] || [];
    var points = items.map(function (item, index) {
      return {
        item: item,
        value: changeAt(items, index, monthsBack)
      };
    });
    return range === 'all' ? points : points.slice(-Number(range) * 12);
  }

  function chartSvg(headline, core, isYearOverYear) {
    var width = 900;
    var height = 270;
    var left = 48;
    var right = 18;
    var top = 22;
    var bottom = 35;
    var values = headline.concat(core).map(function (point) {
      return point.value;
    }).filter(function (value) {
      return Number.isFinite(value);
    });
    if (!values.length) return '<p class="cpi-unavailable">No current data available.</p>';

    var min = Math.min(0, Math.min.apply(Math, values));
    var max = Math.max(isYearOverYear ? 2 : 1, Math.max.apply(Math, values));
    var x = function (index, length) {
      return left + index * ((width - left - right) / Math.max(1, length - 1));
    };
    var y = function (value) {
      return top + (max - value) * ((height - top - bottom) / (max - min || 1));
    };

    function path(points, className) {
      var segments = [];
      var segment = [];
      points.forEach(function (point, index) {
        if (!Number.isFinite(point.value)) {
          if (segment.length) segments.push(segment);
          segment = [];
          return;
        }
        segment.push({ point: point, index: index });
      });
      if (segment.length) segments.push(segment);

      return segments.map(function (items) {
        return '<path class="' + className + '" d="' + items.map(function (item, index) {
          return (index ? 'L' : 'M') +
            x(item.index, points.length).toFixed(1) + ' ' +
            y(item.point.value).toFixed(1);
        }).join(' ') + '" />';
      }).join('');
    }

    var labels = headline.filter(function (_, index) {
      return index === 0 ||
        index === headline.length - 1 ||
        index % Math.max(1, Math.floor(headline.length / 5)) === 0;
    }).map(function (point) {
      var index = headline.indexOf(point);
      return '<text x="' + x(index, headline.length).toFixed(1) +
        '" y="' + (height - 10) +
        '" text-anchor="middle">' +
        escapeXml(String(point.item.year).slice(-2) + '/' +
          String(point.item.month).padStart(2, '0')) +
        '</text>';
    }).join('');

    var target = isYearOverYear
      ? '<path class="target-line" d="M' + left + ' ' + y(2).toFixed(1) +
        'H' + (width - right) + '" /><text x="' + (width - right - 4) +
        '" y="' + (y(2) - 5).toFixed(1) +
        '" text-anchor="end">Fed 2% goal</text>'
      : '';
    return '<svg viewBox="0 0 ' + width + ' ' + height +
      '" role="img" aria-label="' +
      (isYearOverYear ? 'Headline and core CPI year-over-year percent changes' :
        'Headline and core CPI month-over-month percent changes') +
      '"><line class="grid-line" x1="' + left + '" x2="' + (width - right) +
      '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) +
      '" />' + target + path(headline, 'headline-line') +
      path(core, 'core-line') + labels +
      '<text x="' + (left + 4) + '" y="14">Headline CPI (%)</text>' +
      '<text x="' + (left + 120) + '" y="14">Core CPI (%)</text></svg>';
  }

  function renderCharts() {
    var headlineYoY = ratePoints('headlineNsa', 12, chartRange);
    var coreYoY = ratePoints('coreNsa', 12, chartRange);
    var headlineMoM = ratePoints('headlineSa', 1, chartRange);
    var coreMoM = ratePoints('coreSa', 1, chartRange);
    var chart = query('#cpi-trend-chart');
    var momentum = query('#cpi-momentum-chart');
    if (chart) chart.innerHTML = chartSvg(headlineYoY, coreYoY, true);
    if (momentum) momentum.innerHTML = chartSvg(headlineMoM, coreMoM, false);
  }

  function renderHistory() {
    var body = query('#cpi-history-body');
    if (!body) return;

    var headlineNsa = seriesData.headlineNsa || [];
    var headlineSa = seriesData.headlineSa || [];
    var coreNsa = seriesData.coreNsa || [];
    var coreSa = seriesData.coreSa || [];
    var headlineIndex = new Map(headlineNsa.map(function (item, index) {
      return [periodKey(item), index];
    }));
    var headlineSaIndex = new Map(headlineSa.map(function (item, index) {
      return [periodKey(item), index];
    }));
    var coreIndex = new Map(coreNsa.map(function (item, index) {
      return [periodKey(item), index];
    }));
    var coreSaIndex = new Map(coreSa.map(function (item, index) {
      return [periodKey(item), index];
    }));
    var history = tableRange === 'all'
      ? headlineNsa
      : headlineNsa.slice(-Number(tableRange) * 12);
    var rows = history.slice().reverse().map(function (item) {
      var key = periodKey(item);
      var nsaIndex = headlineIndex.get(key);
      var saIndex = headlineSaIndex.get(key);
      var currentCoreIndex = coreIndex.get(key);
      var currentCoreSaIndex = coreSaIndex.get(key);

      return '<tr><td>Unavailable</td><th scope="row">' +
        escapeXml(periodLabel(item)) + '</th><td>' +
        formatRate(changeAt(headlineNsa, nsaIndex, 12)) + '</td><td>' +
        formatRate(changeAt(coreNsa, currentCoreIndex, 12)) + '</td><td>' +
        formatRate(changeAt(headlineSa, saIndex, 1)) + '</td><td>' +
        formatRate(changeAt(coreSa, currentCoreSaIndex, 1)) +
        '</td></tr>';
    });
    body.innerHTML = rows.length
      ? rows.join('')
      : '<tr><td colspan="6">No current data available.</td></tr>';
  }

  function renderComparisons() {
    var body = query('#cpi-results-body');
    if (!body) return;

    var metrics = [
      { label: 'Headline CPI m/m', key: 'headlineSa', lag: 1 },
      { label: 'Headline CPI y/y', key: 'headlineNsa', lag: 12 },
      { label: 'Core CPI m/m', key: 'coreSa', lag: 1 },
      { label: 'Core CPI y/y', key: 'coreNsa', lag: 12 }
    ];
    body.innerHTML = metrics.map(function (metric) {
      var result = latestMetric(metric.key, metric.lag);
      return '<tr><th scope="row">' + metric.label + '</th><td>' +
        formatRate(result.current) +
        '</td><td>N/A</td><td>' + formatRate(result.previous) +
        '</td><td>N/A</td></tr>';
    }).join('');
  }

  function renderUnavailable(error) {
    console.error('Unable to retrieve BLS CPI data', error);
    setText('[data-cpi-status]', 'BLS CPI data could not be retrieved. Retry the request; no sample values are shown.');
    ['#cpi-trend-chart', '#cpi-momentum-chart'].forEach(function (selector) {
      setText(selector, 'No current data available.');
    });
    var body = query('#cpi-history-body');
    if (body) body.innerHTML = '<tr><td colspan="6">BLS historical data is unavailable.</td></tr>';
    var resultBody = query('#cpi-results-body');
    if (resultBody) resultBody.innerHTML = '<tr><td colspan="5">BLS CPI data is unavailable.</td></tr>';
    queryAll('[data-cpi]').forEach(function (element) {
      if (element.getAttribute('data-cpi') !== 'release-date') {
        element.textContent = 'Data unavailable';
      }
    });
    queryAll('[data-component]').forEach(function (element) {
      element.textContent = 'Data unavailable';
    });
  }

  function showPayload(payload, retrievedAt, stale) {
    if (!payload || payload.status !== 'REQUEST_SUCCEEDED') {
      throw new Error('BLS returned an unsuccessful CPI response');
    }
    var bySeries = {};
    (payload.Results && payload.Results.series || []).forEach(function (series) {
      bySeries[series.seriesID] = normalizeObservations(series.data);
    });

    var nextSeriesData = {};
    Object.keys(SERIES).forEach(function (key) {
      nextSeriesData[key] = bySeries[SERIES[key]] || [];
    });
    ['headlineNsa', 'headlineSa', 'coreNsa', 'coreSa'].forEach(function (key) {
      if (nextSeriesData[key].length < 13) {
        throw new Error('A required headline or core CPI series is missing or incomplete');
      }
    });
    seriesData = nextSeriesData;

    updateSnapshot();
    updateComponents();
    renderCharts();
    renderHistory();
    renderComparisons();

    var headline = seriesData.headlineNsa[seriesData.headlineNsa.length - 1];
    var retrieved = new Date(retrievedAt);
    var message = 'Latest reference period: ' + periodLabel(headline) +
      '. Retrieved from the U.S. Bureau of Labor Statistics at ' +
      (Number.isNaN(retrieved.getTime()) ? 'an unknown time' : retrieved.toLocaleString()) +
      '. BLS publication date and upcoming release schedule are unavailable.';
    if (stale) {
      message = 'Stale cached data: ' + message +
        ' The latest refresh failed; retry when the connection is restored.';
    }
    setText('[data-cpi-status]', message);
  }

  function readCache() {
    try {
      var stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Unable to read cached BLS CPI data', error);
      return null;
    }
  }

  function writeCache(payload, retrievedAt) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ payload: payload, retrievedAt: retrievedAt }));
    } catch (error) {
      console.warn('Unable to cache BLS CPI data', error);
    }
  }

  function loadBls() {
    if (requestInFlight) return requestInFlight;
    var cache = readCache();
    if (cache && cache.payload) {
      try {
        showPayload(cache.payload, cache.retrievedAt, Date.now() - Number(cache.retrievedAt) > CACHE_MAX_AGE);
      } catch (error) {
        console.warn('Ignoring invalid cached BLS CPI data', error);
        cache = null;
      }
    }

    var currentYear = new Date().getUTCFullYear();
    var body = {
      seriesid: Object.keys(SERIES).map(function (key) { return SERIES[key]; }),
      startyear: String(currentYear - 10),
      endyear: String(currentYear)
    };
    requestInFlight = fetch(BLS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (response) {
      if (!response.ok) throw new Error('BLS data request failed with HTTP ' + response.status);
      return response.json();
    }).then(function (payload) {
      var retrievedAt = Date.now();
      showPayload(payload, retrievedAt, false);
      writeCache(payload, retrievedAt);
    }).catch(function (error) {
      if (cache && cache.payload) {
        console.error('BLS CPI refresh failed; retaining cached observations', error);
        showPayload(cache.payload, cache.retrievedAt, true);
      } else {
        renderUnavailable(error);
      }
    }).finally(function () {
      requestInFlight = null;
    });
    return requestInFlight;
  }

  function renderMarketUnavailable(error) {
    if (error) console.error('Unable to retrieve CPI market context', error);
    queryAll('[data-cpi-symbol]').forEach(function (card) {
      card.querySelector('strong').textContent = 'Data unavailable';
      card.querySelector('small').textContent = 'Existing EconomicLab quote provider unavailable';
    });
  }

  function loadMarkets() {
    fetch(MARKET_ENDPOINT + '?symbols=USDIndex,XAUUSD,EURUSD,BTCUSD', {
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Market quote request failed with HTTP ' + response.status);
      return response.json();
    }).then(function (quotes) {
      var map = {};
      (Array.isArray(quotes) ? quotes : []).forEach(function (quote) {
        map[quote.id] = quote;
      });
      queryAll('[data-cpi-symbol]').forEach(function (card) {
        var quote = map[card.getAttribute('data-cpi-symbol')];
        if (!quote || quote.price == null) {
          card.querySelector('strong').textContent = 'Data unavailable';
          card.querySelector('small').textContent = 'No verified quote returned';
          return;
        }
        card.querySelector('strong').textContent = Number(quote.price).toLocaleString(undefined, {
          maximumFractionDigits: 5
        });
        card.querySelector('small').textContent = 'Daily change: ' +
          (quote.changePercent == null ? 'unavailable' : Number(quote.changePercent).toFixed(2) + '%') +
          ' | Updated: ' + new Date(quote.timestamp).toLocaleString();
      });
    }).catch(renderMarketUnavailable);
  }

  queryAll('[data-cpi-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      chartRange = button.getAttribute('data-cpi-range');
      queryAll('[data-cpi-range]').forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      renderCharts();
    });
  });

  queryAll('[data-cpi-table-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      tableRange = button.getAttribute('data-cpi-table-range');
      queryAll('[data-cpi-table-range]').forEach(function (item) {
        item.classList.toggle('is-active', item === button);
      });
      renderHistory();
    });
  });

  var retryButton = query('[data-cpi-retry]');
  if (retryButton) retryButton.addEventListener('click', loadBls);

  loadBls();
  loadMarkets();
  window.setInterval(loadBls, REFRESH_INTERVAL);
})();
