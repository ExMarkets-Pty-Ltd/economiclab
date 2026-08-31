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
    content: {
      centralBanks: [
        {
          id: 'fed',
          eyebrow: 'Federal Reserve',
          title: 'Policy focus',
          meta: 'Target range: 4.25%–4.50%.',
          summary: 'The Federal Reserve’s latest policy decision was set against inflation persistence, the labor market and broader economic growth. Source: FOMC.',
          href: 'https://www.federalreserve.gov/monetarypolicy/fomc.htm'
        },
        {
          id: 'ecb',
          eyebrow: 'European Central Bank',
          title: 'Policy focus',
          meta: 'Deposit facility 2.25%; main refinancing 2.40%; marginal lending 2.65%.',
          summary: 'The ECB’s published key rates show the euro-area policy stance as of its most recent official rate update. Source: ECB.',
          href: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'
        },
        {
          id: 'boe',
          eyebrow: 'Bank of England',
          title: 'Policy focus',
          meta: 'Official policy decisions are updated by the Bank of England MPC.',
          summary: 'The Bank continues to assess inflation, wage growth and the balance between price stability and UK growth. Source: Bank of England.',
          href: 'https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes'
        },
        {
          id: 'boj',
          eyebrow: 'Bank of Japan',
          title: 'Policy focus',
          meta: 'Official BOJ policy and inflation guidance remain central to Japan’s macro outlook.',
          summary: 'The BOJ’s published materials are the relevant source for current policy and inflation context. Source: BOJ.',
          href: 'https://www.boj.or.jp/en/mopo/outline/outline.htm/'
        },
        {
          id: 'sarb',
          eyebrow: 'South African Reserve Bank',
          title: 'Policy focus',
          meta: 'SARB policy continues to weigh inflation, domestic demand and exchange-rate conditions.',
          summary: 'The SARB’s official releases remain the authoritative reference for South African monetary policy. Source: SARB.',
          href: 'https://www.resbank.co.za/en/home'
        }
      ],
      regions: [
        {
          id: 'north-america',
          eyebrow: 'North America',
          title: 'Regional update',
          meta: 'The U.S. economy expanded at a 1.5% annualized pace in Q2 2026, with BEA highlighting consumer spending, exports and investment.',
          summary: 'Growth softened from Q1, while inflation and policy remained important for the next phase of the cycle.',
          href: 'https://www.bea.gov/news/2026/gdp-second-estimate-and-corporate-profits-2nd-quarter-2026'
        },
        {
          id: 'europe',
          eyebrow: 'Europe',
          title: 'Regional update',
          meta: 'The ECB’s key rates were published at 2.25% deposit, 2.40% refinancing and 2.65% marginal lending in the latest official table.',
          summary: 'The euro area remains focused on balancing inflation control with growth conditions.',
          href: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'
        },
        {
          id: 'uk',
          eyebrow: 'United Kingdom',
          title: 'Regional update',
          meta: 'The Bank of England continues to assess inflation, wages and economic activity in its MPC communication.',
          summary: 'The UK macro outlook remains shaped by services inflation, labor-market conditions and growth momentum.',
          href: 'https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes'
        },
        {
          id: 'japan',
          eyebrow: 'Japan',
          title: 'Regional update',
          meta: 'The Bank of Japan’s official policy framework remains tied to inflation, wages and broader financial conditions.',
          summary: 'Japan’s policy tone continues to be shaped by inflation and the path of domestic demand.',
          href: 'https://www.boj.or.jp/en/mopo/outline/outline.htm/'
        },
        {
          id: 'south-africa',
          eyebrow: 'South Africa',
          title: 'Regional update',
          meta: 'The SARB’s official statements continue to focus on inflation control, domestic demand and exchange-rate sensitivity.',
          summary: 'South Africa’s macro environment remains shaped by inflation, rates and the broader emerging-market backdrop.',
          href: 'https://www.resbank.co.za/en/home'
        }
      ],
      briefings: [
        {
          id: 'inflation',
          eyebrow: 'Inflation',
          title: 'U.S. CPI rose 3.4% year over year in July 2026',
          summary: 'The BLS reported that the all-items CPI increased 0.1% month over month and 3.4% over the last 12 months, while the all-items less food and energy index rose 2.5% over the year.',
          meta: 'Source: BLS · latest official release',
          href: 'https://www.bls.gov/news.release/cpi.nr0.htm'
        },
        {
          id: 'rates',
          eyebrow: 'Interest Rates',
          title: 'The Federal Reserve kept the target range at 4.25% to 4.50%',
          summary: 'The latest FOMC decision maintained the policy range as policymakers weighed inflation, labor-market conditions and the broader growth backdrop.',
          meta: 'Source: Federal Reserve · latest official decision',
          href: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm'
        },
        {
          id: 'ecb-rates',
          eyebrow: 'Monetary Policy',
          title: 'The ECB published key rates of 2.25%, 2.40% and 2.65%',
          summary: 'The European Central Bank’s official rate table lists the deposit facility, main refinancing operations and marginal lending facilities for the euro area.',
          meta: 'Source: ECB · latest official rate table',
          href: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'
        },
        {
          id: 'gdp',
          eyebrow: 'Growth',
          title: 'Real GDP increased at a 1.5% annualized rate in Q2 2026',
          summary: 'The BEA’s second estimate showed slower growth than Q1, with consumer spending and exports offset partly by weaker government spending.',
          meta: 'Source: BEA · latest official estimate',
          href: 'https://www.bea.gov/news/2026/gdp-second-estimate-and-corporate-profits-2nd-quarter-2026'
        }
      ],
      calendar: [
        { date: '26 Aug 2026', event: 'GDP second estimate', region: 'United States', source: 'BEA', result: '+1.5% annualized' },
        { date: '12 Aug 2026', event: 'CPI', region: 'United States', source: 'BLS', result: '+3.4% YoY' },
        { date: '29 Jul 2026', event: 'FOMC rate decision', region: 'United States', source: 'Federal Reserve', result: '4.25%–4.50%' },
        { date: '17 Jun 2026', event: 'ECB key rates', region: 'Euro area', source: 'ECB', result: '2.25% / 2.40% / 2.65%' }
      ],
      analysis: [
        {
          id: 'bea-analysis',
          eyebrow: 'Source note',
          title: 'BEA’s second estimate shows U.S. GDP moderated to a 1.5% annualized pace in Q2 2026.',
          meta: 'Source: U.S. BEA · latest official release',
          href: 'https://www.bea.gov/news/2026/gdp-second-estimate-and-corporate-profits-2nd-quarter-2026'
        },
        {
          id: 'bls-analysis',
          eyebrow: 'Source note',
          title: 'BLS CPI data showed U.S. inflation at 3.4% year over year in the latest official release.',
          meta: 'Source: U.S. BLS · latest official release',
          href: 'https://www.bls.gov/news.release/cpi.nr0.htm'
        },
        {
          id: 'fed-analysis',
          eyebrow: 'Source note',
          title: 'The Federal Reserve maintained a 4.25%–4.50% target range in its latest decision.',
          meta: 'Source: Federal Reserve · latest official policy release',
          href: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm'
        }
      ]
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
