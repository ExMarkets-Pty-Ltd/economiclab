const { handler: gdpHandler } = require('./gdp-data.js');
const { handler: cpiHandler } = require('./cpi-data.js');

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function callHandler(handler, eventOverrides) {
  const response = await handler({ httpMethod: 'POST', body: JSON.stringify(eventOverrides || {}), ...eventOverrides });
  if (!response || !response.body) {
    return { status: 'REQUEST_FAILED', series: [] };
  }
  return JSON.parse(response.body);
}

function normaliseCpiSeries(series) {
  const items = Array.isArray(series) ? series : [];
  const latest = items[items.length - 1] || null;
  const prev = items[items.length - 2] || null;
  const yoy = latest && prev ? ((latest.value / prev.value) - 1) * 100 : null;
  return {
    latest: latest ? { value: latest.value, date: latest.date || latest.period, period: latest.periodName || latest.date || 'latest' } : null,
    yoy: yoy,
    period: latest ? (latest.periodName || latest.date || 'latest') : 'latest'
  };
}

function pickLatestRelease(items) {
  if (!Array.isArray(items) || !items.length) return null;
  const valid = items.filter((item) => item && Number.isFinite(item.value));
  if (!valid.length) return null;
  const latest = valid[valid.length - 1];
  return {
    value: latest.value,
    date: latest.date,
    label: latest.date ? new Date(latest.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'latest',
    period: latest.date ? new Date(latest.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'latest',
    source: 'BEA / FRED'
  };
}

async function fetchOfficialData() {
  const [gdpPayload, cpiPayload] = await Promise.all([
    callHandler(gdpHandler, { seriesid: ['GDPC1', 'A191RL1Q225SBEA', 'GDP', 'GDPDEF'] }),
    callHandler(cpiHandler, { seriesid: ['CUUR0000SA0', 'CUSR0000SA0L1E'], startyear: String(new Date().getUTCFullYear() - 10), endyear: String(new Date().getUTCFullYear()) })
  ]);

  const gdpSeries = {};
  for (const entry of Array.isArray(gdpPayload && gdpPayload.series) ? gdpPayload.series : []) {
    if (entry && entry.id) {
      gdpSeries[entry.id] = Array.isArray(entry.data) ? entry.data : [];
    }
  }

  const cpiSeries = {};
  for (const series of Array.isArray(cpiPayload && cpiPayload.Results && cpiPayload.Results.series) ? cpiPayload.Results.series : []) {
    if (series && series.seriesID) {
      const rows = Array.isArray(series.data) ? series.data : [];
      cpiSeries[series.seriesID] = rows
        .filter((item) => item && /^M(0[1-9]|1[0-2])$/.test(item.period))
        .map((item) => ({
          date: item.year && item.period ? String(item.year) + '-' + String(item.period).replace('M', '').padStart(2, '0') : null,
          periodName: item.periodName || (item.period ? item.period : 'latest'),
          value: toNumber(item.value)
        }))
        .filter((item) => item && item.value !== null);
    }
  }

  const cpiHeadline = normaliseCpiSeries(cpiSeries.CUUR0000SA0 || []);
  const cpiCore = normaliseCpiSeries(cpiSeries.CUSR0000SA0L1E || []);
  const gdpGrowth = pickLatestRelease(gdpSeries.A191RL1Q225SBEA || []);

  return {
    data: {
      gdp: {
        latest: gdpGrowth,
        series: gdpSeries.A191RL1Q225SBEA || []
      },
      cpi: {
        headline: {
          yoy: cpiHeadline.yoy,
          period: cpiHeadline.period,
          latest: cpiHeadline.latest
        },
        core: {
          yoy: cpiCore.yoy,
          period: cpiCore.period,
          latest: cpiCore.latest
        }
      },
      rates: {
        fed: {
          value: '4.25%–4.50%',
          chip: '• 4.25–4.50%',
          meta: 'Current range, Federal Reserve, latest FOMC decision'
        },
        ecbDeposit: {
          value: '2.25%',
          chip: '• 2.25%',
          meta: 'Latest official ECB deposit facility rate'
        },
        ecbMain: {
          value: '2.40%',
          chip: '• 2.40%',
          meta: 'Latest official ECB main refinancing rate'
        }
      }
    },
    source: 'Official BEA, BLS, FOMC and ECB data',
    updatedAt: new Date().toISOString()
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'GET, POST' }, body: JSON.stringify({ error: 'Use GET or POST for economy-data requests.' }) };
  }

  try {
    const payload = await fetchOfficialData();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(payload)
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        status: 'REQUEST_FAILED',
        message: 'Official economy data is temporarily unavailable. Please refer to the BEA and BLS source links.',
        data: {
          gdp: { latest: null },
          cpi: { headline: {}, core: {} },
          rates: { fed: { value: 'Data unavailable' }, ecbDeposit: { value: 'Data unavailable' }, ecbMain: { value: 'Data unavailable' } }
        }
      })
    };
  }
};
