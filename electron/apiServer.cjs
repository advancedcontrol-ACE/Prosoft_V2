const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { bridgeInstance } = require('../src/services/modbus/modbusServerBridge.cjs');
const { remoteLabManager } = require('../src/services/modbus/remoteLabManager.cjs');

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

function getPrimaryLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!net.address.startsWith('169.254.')) {
          return net.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

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
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const sessionToken = req.headers['x-session-token'];

    // CORS headers for local loopback & remote tunnels
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-token');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // ── Remote Lab Authentication & Session Endpoints ──────────

    // 1. /api/remote/host-info - Host network IP & Port details for teacher display
    if (pathname === '/api/remote/host-info' && req.method === 'GET') {
      const port = server.address() ? server.address().port : 5173;
      const localIp = getPrimaryLocalIp();
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          port,
          localIp,
          localUrl: `http://${localIp}:${port}`,
          passkey: remoteLabManager.getPasskey(),
        })
      );
      return;
    }

    // 2. /api/remote/status - Public status check for remote connection
    if (pathname === '/api/remote/status' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          serverName: 'ACE Prosoft V2 Lab Host',
          hardwareConnected: bridgeInstance.isConnected,
          activePort: bridgeInstance.currentPort || 'None',
          passkeyRequired: true,
        })
      );
      return;
    }

    // 3. /api/remote/auth - Student login with passkey
    if (pathname === '/api/remote/auth' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const authResult = remoteLabManager.authenticate(body.passkey, body.studentName, clientIp);
      res.setHeader('Content-Type', 'application/json');
      if (authResult.success) {
        res.end(
          JSON.stringify({
            ...authResult,
            hardwareConnected: bridgeInstance.isConnected,
            activePort: bridgeInstance.currentPort || 'None',
          })
        );
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify(authResult));
      }
      return;
    }

    // 4. /api/remote/sessions - Host monitor listing connected students
    if (pathname === '/api/remote/sessions' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          passkey: remoteLabManager.getPasskey(),
          sessions: remoteLabManager.getActiveSessions(),
        })
      );
      return;
    }

    // 5. /api/remote/revoke - Host revoking student access
    if (pathname === '/api/remote/revoke' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const ok = remoteLabManager.revokeSession(body.token);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: ok }));
      return;
    }

    // 6. /api/remote/set-passkey - Host updating the access passkey
    if (pathname === '/api/remote/set-passkey' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const updated = remoteLabManager.setPasskey(body.passkey);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, passkey: updated }));
      return;
    }

    // 6a. /api/remote/tunnel/start - Host starting the Cloudflare tunnel
    if (pathname === '/api/remote/tunnel/start' && req.method === 'POST') {
      const port = server.address() ? server.address().port : 5173;
      try {
        const result = await remoteLabManager.startTunnel(port);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: String(err && err.message ? err.message : err) }));
      }
      return;
    }

    // 6b. /api/remote/tunnel/stop - Host stopping the Cloudflare tunnel
    if (pathname === '/api/remote/tunnel/stop' && req.method === 'POST') {
      const result = remoteLabManager.stopTunnel();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }

    // 6c. /api/remote/tunnel/status - Status of the Cloudflare tunnel
    if (pathname === '/api/remote/tunnel/status' && req.method === 'GET') {
      const status = remoteLabManager.getTunnelStatus();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, ...status }));
      return;
    }

    // 6d. /api/remote/tunnel/test - Test tunnel connectivity and latency
    if (pathname === '/api/remote/tunnel/test' && req.method === 'POST') {
      const testResult = await remoteLabManager.testTunnel();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(testResult));
      return;
    }

    // ── Hardware & Modbus RTU Endpoints ────────────────────────

    // 7. /api/ports
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

    // 8. /api/modbus/connect
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

    // 9. /api/modbus/poll
    if (pathname === '/api/modbus/poll' && req.method === 'GET') {
      if (sessionToken) {
        const check = remoteLabManager.validateSession(sessionToken);
        if (!check.valid) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: check.error, revoked: true }));
          return;
        }
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(bridgeInstance.latestData));
      return;
    }

    // 10. /api/modbus/write
    if (pathname === '/api/modbus/write' && req.method === 'POST') {
      if (sessionToken) {
        const check = remoteLabManager.validateSession(sessionToken);
        if (!check.valid) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: check.error, revoked: true }));
          return;
        }
      }

      const body = await parseJsonBody(req);
      const slaveId = Number(body.slaveId) || bridgeInstance.slaveId || 1;
      const reg = String(body.register || '').toLowerCase();
      const val = body.value;

      if (sessionToken) {
        remoteLabManager.validateSession(sessionToken, `Wrote ${reg.toUpperCase()}=${val}`);
      }

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

    // 11. /api/modbus/disconnect
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
    start: (preferredPort = 5173) => {
      return new Promise((resolve, reject) => {
        const tryListen = (p) => {
          server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              console.warn(`[API Server] Port ${p} in use, trying ${p + 1}...`);
              tryListen(p + 1);
            } else {
              reject(err);
            }
          });
          server.listen(p, '0.0.0.0', () => {
            const address = server.address();
            resolve(address.port);
          });
        };
        tryListen(preferredPort);
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

module.exports = { createApiServer, bridgeInstance, remoteLabManager };
