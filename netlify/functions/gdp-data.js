const FRED_BASE = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter((row) => row.observation_date && row[headers[1]]).map((row) => ({
    date: row.observation_date,
    value: Number(row[headers[1]])
  })).filter((row) => Number.isFinite(row.value));
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

function titleToRelease(item) {
  const text = String(item.title || '');
  const match = text.match(/(GDP|Gross Domestic Product)/i);
  if (!match) return null;
  const title = text.replace(/<[^>]+>/g, '').trim();
  const date = item.pubDate ? new Date(item.pubDate) : null;
  const time = date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) : '8:30 AM';
  const quarter = title.match(/(Q[1-4]\s*\d{4})/i)?.[1] || 'Current quarter';
  const type = /second estimate|third estimate|advance estimate/i.test(title) ? title.match(/(Advance Estimate|Second Estimate|Third Estimate)/i)?.[1] || 'GDP' : 'GDP';
  return {
    type: type,
    quarter,
    date: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Data currently unavailable',
    time,
    dateTime: date ? date.toISOString() : null,
    source: 'BEA'
  };
}

async function fetchBearsSchedule() {
  const url = 'https://apps.bea.gov/rss/rss.xml';
  const response = await fetch(url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' }
  });
  if (!response.ok) {
    throw new Error('BEA RSS schedule request failed');
  }
  const xml = await response.text();
  const entries = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const versions = entries.map((entry) => {
    const block = entry[1];
    const title = (block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';
    return { title: title.replace(/<[^>]+>/g, '').trim(), pubDate };
  }).map((item) => ({ ...item, release: titleToRelease(item) })).filter((item) => item.release);

  const future = versions.filter((item) => {
    if (!item.pubDate) return false;
    return new Date(item.pubDate).getTime() > Date.now();
  });

  if (future.length) {
    return future.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()).slice(0, 8).map((item) => item.release);
  }

  return versions.slice(0, 8).map((item) => item.release).filter(Boolean);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { Allow: 'POST, GET' }, body: JSON.stringify({ error: 'Use POST or GET for GDP series requests.' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    if (body.action === 'release-schedule') {
      const schedule = await fetchBearsSchedule();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ status: 'REQUEST_SUCCEEDED', schedule })
      };
    }

    const seriesIds = Array.isArray(body.seriesid) && body.seriesid.length ? body.seriesid : ['GDPC1', 'GDP', 'GDPDEF', 'A191RL1Q225SBEA', 'GPDIC1', 'GCEC1'];
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
      body: JSON.stringify({ status: 'REQUEST_FAILED', error: error.message || 'GDP data could not be retrieved.' })
    };
  }
};
