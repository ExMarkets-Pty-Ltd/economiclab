const BLS_ENDPOINT = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const YEAR_PATTERN = /^\d{4}$/;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}

async function fetchBlsRange(seriesid, startyear, endyear) {
  const response = await fetch(BLS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ seriesid, startyear, endyear })
  });

  if (!response.ok) {
    throw new Error('BLS CPI API returned HTTP ' + response.status);
  }

  const payload = await response.json();
  if (payload.status !== 'REQUEST_SUCCEEDED') {
    throw new Error('BLS CPI API request failed: ' + (payload.message || payload.status));
  }

  return payload;
}

function mergeSeriesPayloads(payloads) {
  const mergedPayload = payloads[0];
  if (payloads.length === 1) return mergedPayload;

  const seriesById = new Map();
  payloads.forEach((payload) => {
    (payload.Results && payload.Results.series || []).forEach((series) => {
      const current = seriesById.get(series.seriesID);
      if (current) {
        current.data = current.data.concat(series.data || []);
      } else {
        seriesById.set(series.seriesID, { ...series, data: (series.data || []).slice() });
      }
    });
  });

  mergedPayload.Results.series = Array.from(seriesById.values()).map((series) => ({
    ...series,
    data: series.data.sort((a, b) =>
      Number(b.year) - Number(a.year) || String(b.period).localeCompare(String(a.period))
    )
  }));
  return mergedPayload;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Use POST for CPI series requests.' });
  }

  let request;
  try {
    request = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    return jsonResponse(400, { error: 'The CPI series request must contain valid JSON.' });
  }

  const seriesid = Array.isArray(request.seriesid) ? request.seriesid : [];
  if (
    !seriesid.length ||
    seriesid.length > 50 ||
    seriesid.some((id) => typeof id !== 'string' || !/^[A-Z0-9]{2,20}$/.test(id))
  ) {
    return jsonResponse(400, { error: 'A valid BLS series list is required.' });
  }

  const currentYear = new Date().getUTCFullYear();
  const startyear = request.startyear === undefined ? currentYear - 10 : String(request.startyear);
  const endyear = request.endyear === undefined ? currentYear : String(request.endyear);
  if (
    !YEAR_PATTERN.test(startyear) ||
    !YEAR_PATTERN.test(endyear) ||
    Number(startyear) > Number(endyear) ||
    Number(endyear) > currentYear ||
    Number(endyear) - Number(startyear) > 10
  ) {
    return jsonResponse(400, { error: 'The requested BLS date range must be valid and no longer than 10 years.' });
  }

  try {
    const spansMoreThanTenCalendarYears = Number(endyear) - Number(startyear) === 10;
    const ranges = spansMoreThanTenCalendarYears
      ? [[startyear, String(Number(endyear) - 1)], [endyear, endyear]]
      : [[startyear, endyear]];
    const payloads = await Promise.all(ranges.map((range) =>
      fetchBlsRange(seriesid, range[0], range[1])
    ));
    return jsonResponse(200, mergeSeriesPayloads(payloads));
  } catch (error) {
    console.error('BLS CPI request failed', error);
    return jsonResponse(502, { error: 'BLS CPI data could not be retrieved.' });
  }
};
