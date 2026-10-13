const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { bridgeInstance } = require('../src/services/modbus/modbusServerBridge.cjs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
};

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function createApiServer(distPath) {
  const server = http.createServer(async (req, res) => {
    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, 'http://localhost');
    const pathname = parsedUrl.pathname;

    // CORS headers for local loopback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // 1. /api/ports
    if (pathname === '/api/ports') {
      exec('powershell -NoProfile -Command "[System.IO.Ports.SerialPort]::GetPortNames()"', (err, stdout) => {
        res.setHeader('Content-Type', 'application/json');
        if (err || !stdout) {
          res.end(JSON.stringify([]));
          return;
        }
        const ports = stdout
          .split(/[\r\n]+/)
          .map((s) => s.trim().toUpperCase())
          .filter((s) => /^COM\d+$/.test(s));
        const uniquePorts = Array.from(new Set(ports));
        res.end(JSON.stringify(uniquePorts));
      });
      return;
    }

    // 2. /api/modbus/connect
    if (pathname === '/api/modbus/connect' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const port = body.port || 'COM4';
      const baud = Number(body.baud) || 9600;
      const slaveId = Number(body.slaveId) || 1;
      try {
        const result = await bridgeInstance.connect(port, baud, slaveId);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: String(err && err.message ? err.message : err) }));
      }
      return;
    }

    // 3. /api/modbus/poll
    if (pathname === '/api/modbus/poll' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(bridgeInstance.latestData));
      return;
    }

    // 4. /api/modbus/write
    if (pathname === '/api/modbus/write' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const slaveId = Number(body.slaveId) || bridgeInstance.slaveId || 1;
      const reg = String(body.register || '').toLowerCase();
      const val = body.value;

      let addr = 0;
      let rawVal = 0;

      if (reg === 'sp' || body.addr === 0x1001) {
        addr = 0x1001;
        rawVal = Math.round(Number(val) * 10);
      } else if (reg === 'pb' || body.addr === 0x1009) {
        addr = 0x1009;
        rawVal = Math.round(Number(val) * 10);
      } else if (reg === 'it' || reg === 'ti' || body.addr === 0x100a) {
        addr = 0x100a;
        rawVal = Math.round(Number(val));
      } else if (reg === 'dt' || reg === 'td' || body.addr === 0x100b) {
        addr = 0x100b;
        rawVal = Math.round(Number(val));
      } else if (reg === 'bias' || body.addr === 0x100c) {
        addr = 0x100c;
        rawVal = Math.round(Number(val));
      } else if (reg === 'op' || body.addr === 0x1012) {
        addr = 0x1012;
        rawVal = Math.round(Number(val) * 10);
      } else if (reg === 'automan' || reg === 'auto' || body.addr === 0x1005) {
        addr = 0x1005;
        rawVal = val === 'Manual' || val === 1 ? 1 : 0;
      } else if (reg === 'action' || body.addr === 0x1006) {
        addr = 0x1006;
        rawVal = val === 'Direct' || val === 1 ? 1 : 0;
      } else if (reg === 'autotuning' || reg === 'at' || body.addr === 0x0813) {
        addr = 0x0813;
        rawVal = Number(val) ? 1 : 0;
      } else if (typeof body.addr === 'number') {
        addr = body.addr;
        rawVal = Number(val);
      }

      if (addr === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Invalid register' }));
        return;
      }

      try {
        const writeRes = await bridgeInstance.writeRegister(slaveId, addr, rawVal);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, addr, rawVal, writeRes }));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: String(err && err.message ? err.message : err) }));
      }
      return;
    }

    // 5. /api/modbus/disconnect
    if (pathname === '/api/modbus/disconnect' && req.method === 'POST') {
      await bridgeInstance.disconnect();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Disconnected' }));
      return;
    }

    // Static files from dist
    if (!distPath || !fs.existsSync(distPath)) {
      res.statusCode = 404;
      res.end('Dist directory not found');
      return;
    }

    let filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname);

    // If requested path doesn't exist, fallback to index.html (SPA routing support)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error reading file');
        return;
      }
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });

  return {
    server,
    start: () => {
      return new Promise((resolve, reject) => {
        // Listen on 127.0.0.1 with port 0 (dynamic port)
        server.listen(0, '127.0.0.1', () => {
          const address = server.address();
          resolve(address.port);
        });
        server.on('error', reject);
      });
    },
    stop: async () => {
      try {
        await bridgeInstance.disconnect();
      } catch {
        // ignore
      }
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

module.exports = { createApiServer, bridgeInstance };
