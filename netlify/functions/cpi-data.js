const BLS_ENDPOINT = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: JSON.stringify({ error: 'Use POST for CPI series requests.' }) };
  }

  try {
    const request = event.body ? JSON.parse(event.body) : {};
    const seriesid = Array.isArray(request.seriesid) ? request.seriesid : [];
    if (!seriesid.length || seriesid.length > 50) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'A valid CPI series list is required.' }) };
    }

    const response = await fetch(BLS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        seriesid,
        startyear: String(request.startyear || new Date().getUTCFullYear() - 10),
        endyear: String(request.endyear || new Date().getUTCFullYear())
      })
    });

    const body = await response.text();
    return {
      statusCode: response.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body
    };
  } catch (error) {
    return { statusCode: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'BLS CPI data could not be retrieved.' }) };
  }
};
