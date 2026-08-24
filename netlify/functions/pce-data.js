const SERIES_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=';

function parseCsv(text) {
  return text.trim().split(/\r?\n/).slice(1).map((line) => {
    const match = line.match(/^(\d{4}-\d{2}-\d{2}),(.+)$/);
    if (!match) return null;
    const value = Number(match[2]);
    return Number.isFinite(value) ? { date: match[1], value } : null;
  }).filter(Boolean);
}

exports.handler = async function (event) {
  const requested = String((event.queryStringParameters || {}).series || '').split(',').map((value) => value.trim().toUpperCase()).filter(Boolean);
  const allowed = ['PCEPI', 'PCEPILFE', 'PCEDG', 'PCESV', 'PCEDA', 'PCDEE', 'PCE', 'PCEC96', 'PI', 'PSAVERT'];
  const series = requested.filter((value) => allowed.includes(value));
  if (!series.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No approved PCE series requested.' }) };

  try {
    const entries = await Promise.all(series.map(async (id) => {
      const response = await fetch(SERIES_URL + id);
      if (!response.ok) return [id, []];
      return [id, parseCsv(await response.text())];
    }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ source: 'BEA-originated FRED series', data: Object.fromEntries(entries) }) };
  } catch (error) {
    return { statusCode: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'PCE data could not be retrieved.' }) };
  }
};
