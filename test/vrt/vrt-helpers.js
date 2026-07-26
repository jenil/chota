const http = require('http');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, '..');

/**
 * Find an available port starting from the given port.
 */
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

/**
 * Start a deterministic fixture server for VRT testing.
 * Returns { server, url, stop }.
 */
async function startFixtureServer(startPort) {
  const port = await findAvailablePort(startPort);
  
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(FIXTURES_DIR, req.url === '/' ? 'index.html' : req.url);
      
      // Security: prevent directory traversal
      if (!filePath.startsWith(FIXTURES_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
      };
      
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
      });
    });
    
    server.listen(port, () => {
      resolve({
        server,
        port,
        url: `http://localhost:${port}`,
        stop: () => new Promise((cb) => server.close(cb)),
      });
    });
    
    server.on('error', reject);
  });
}

module.exports = { startFixtureServer };
