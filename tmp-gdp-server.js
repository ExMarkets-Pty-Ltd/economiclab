const http = require('http');
const fs = require('fs');
const path = require('path');
const { handler } = require('./netlify/functions/gdp-data.js');

const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8090');

  if (url.pathname === '/.netlify/functions/gdp-data') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const event = { httpMethod: req.method || 'POST', body: body || '{}', headers: req.headers };
        const result = await handler(event);
        res.writeHead(result.statusCode || 200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        });
        res.end(result.body || JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    res.end();
    return;
  }

  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const normalized = requestedPath.replace(/^\/+/, '');
  const filePath = path.join(root, normalized);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err && !requestedPath.endsWith('/')) {
      const directoryIndex = path.join(root, normalized, 'index.html');
      fs.stat(directoryIndex, (dirErr, dirStats) => {
        if (!dirErr && dirStats.isFile()) {
          res.writeHead(200, { 'Content-Type': mime['.html'] || 'text/html; charset=utf-8' });
          fs.createReadStream(directoryIndex).pipe(res);
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
      });
      return;
    }

    if (err || !stats.isFile()) {
      const dirIndex = path.join(filePath, 'index.html');
      fs.stat(dirIndex, (dirErr, dirStats) => {
        if (!dirErr && dirStats.isFile()) {
          res.writeHead(200, { 'Content-Type': mime['.html'] || 'text/html; charset=utf-8' });
          fs.createReadStream(dirIndex).pipe(res);
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(8090, () => {
  console.log('GDP local mock server running at http://localhost:8090');
});
