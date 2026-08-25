const http = require('http');
const fs = require('fs');
const path = require('path');

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
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:8091');
  const normalized = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const requestedPath = normalized || 'index.html';
  const safePath = path.resolve(root, requestedPath);
  const filePath = safePath.startsWith(path.resolve(root)) ? safePath : path.resolve(root, 'index.html');

  if (!filePath.startsWith(path.resolve(root))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err && err.code !== 'ENOENT') {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
      return;
    }

    if (err || !stats.isFile()) {
      const dirIndex = path.join(root, requestedPath, 'index.html');
      fs.stat(dirIndex, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          res.writeHead(200, { 'Content-Type': mime['.html'] || 'text/html; charset=utf-8' });
          fs.createReadStream(dirIndex).pipe(res);
          return;
        }

        const fallback = path.join(root, 'index.html');
        fs.stat(fallback, (fallbackErr, fallbackStats) => {
          if (fallbackErr || !fallbackStats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': mime['.html'] || 'text/html; charset=utf-8' });
          fs.createReadStream(fallback).pipe(res);
        });
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(8091, () => {
  console.log('Static site running at http://localhost:8091');
});
