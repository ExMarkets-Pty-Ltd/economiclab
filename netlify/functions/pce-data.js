const FRED_BASE = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
  return rows
    .filter((row) => row.observation_date && row[headers[1]])
    .map((row) => ({
      date: row.observation_date,
      value: Number(row[headers[1]])
    }))
    .filter((row) => Number.isFinite(row.value));
}

async function fetchSeries(seriesId) {
  const response = await fetch(FRED_BASE + encodeURIComponent(seriesId), {
    headers: { Accept: 'text/csv' }
  });

  if (!response.ok) {
    throw new Error('FRED request failed for ' + seriesId);
  }

  const csv = await response.text();
  return { id: seriesId, data: parseCsv(csv) };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { Allow: 'POST, GET' }, body: JSON.stringify({ error: 'Use POST or GET for PCE series requests.' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const seriesIds = Array.isArray(body.seriesid) && body.seriesid.length ? body.seriesid : ['PCEPI', 'PCEPILFE', 'PCE', 'DSPI', 'DPCERL1Q225SBEA', 'A191RL1Q225SBEA'];
    const results = await Promise.all(seriesIds.map(fetchSeries));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: 'REQUEST_SUCCEEDED', series: results })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: 'REQUEST_FAILED', error: error.message || 'PCE data could not be retrieved.' })
    };
  }
};
