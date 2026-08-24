const fn = require('./netlify/functions/pce-data.js');
fn.handler({
  httpMethod: 'POST',
  body: JSON.stringify({ seriesid: ['PCEPI', 'PCEPILFE', 'PCE', 'DSPI'] })
}).then((r) => {
  const p = JSON.parse(r.body);
  console.log(JSON.stringify({
    statusCode: r.statusCode,
    status: p.status,
    returned: (p.series || []).length,
    hasPce: (p.series || []).some((x) => x.id === 'PCEPI'),
    hasCore: (p.series || []).some((x) => x.id === 'PCEPILFE'),
    first: p.series && p.series[0] && p.series[0].data && p.series[0].data.length
  }));
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
