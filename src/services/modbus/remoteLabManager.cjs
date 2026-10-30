// ============================================================
// Remote Lab Manager: Session Management, Passkey Auth & Tunnel Manager
// ============================================================

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function getCloudflaredPath() {
  const candidates = [
    path.resolve(__dirname, '../../../cloudflared.exe'),
    path.resolve(__dirname, '../../cloudflared.exe'),
    path.resolve(__dirname, '../cloudflared.exe'),
    path.resolve(__dirname, 'cloudflared.exe'),
    process.resourcesPath ? path.join(process.resourcesPath, 'cloudflared.exe') : null,
    path.resolve(process.cwd(), 'cloudflared.exe'),
    'cloudflared.exe',
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c;
    }
  }
  return 'cloudflared.exe';
}

class RemoteLabManager {
  constructor() {
    this.passkey = 'ACE-101';
    this.allowRemote = true;
    this.sessions = new Map();
    this.tunnelProcess = null;
    this.tunnelUrl = null;
    this.tunnelStatus = 'stopped'; // 'stopped' | 'starting' | 'running' | 'error'
    this.tunnelError = null;
  }

  getPasskey() {
    return this.passkey;
  }

  setPasskey(newPasskey) {
    if (newPasskey && typeof newPasskey === 'string') {
      this.passkey = newPasskey.trim();
    }
    return this.passkey;
  }

  authenticate(candidatePasskey, studentName = 'Anonymous Student', clientIp = '127.0.0.1') {
    if (!this.allowRemote) {
      return { success: false, error: 'Remote Lab access is currently disabled by the Host.' };
    }

    if (!candidatePasskey || candidatePasskey.trim() !== this.passkey) {
      return { success: false, error: 'Invalid Lab Access Passkey.' };
    }

    const token = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    const session = {
      token,
      studentName: studentName.trim() || 'Student',
      clientIp: clientIp.replace('::ffff:', ''),
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      lastAction: 'Connected',
      status: 'active',
    };

    this.sessions.set(token, session);

    return {
      success: true,
      token,
      studentName: session.studentName,
      serverTime: Date.now(),
    };
  }

  validateSession(token, updateAction = null) {
    if (!token) return { valid: false, error: 'Missing session token' };

    const session = this.sessions.get(token);
    if (!session) {
      return { valid: false, error: 'Session not found. Please re-authenticate.' };
    }

    if (session.status === 'revoked') {
      return { valid: false, error: 'Access revoked by the Host teacher.' };
    }

    session.lastSeen = Date.now();
    if (updateAction) {
      session.lastAction = updateAction;
    }

    return { valid: true, session };
  }

  revokeSession(token) {
    const session = this.sessions.get(token);
    if (session) {
      session.status = 'revoked';
      session.lastAction = 'Revoked by Host';
      return true;
    }
    return false;
  }

  getActiveSessions() {
    const list = Array.from(this.sessions.values()).map((s) => ({
      token: s.token,
      studentName: s.studentName,
      clientIp: s.clientIp,
      connectedAt: s.connectedAt,
      lastSeen: s.lastSeen,
      lastAction: s.lastAction,
      status: s.status,
    }));
    return list.sort((a, b) => b.lastSeen - a.lastSeen);
  }

  // ── In-App Cloudflare Tunnel Management ─────────────────────────

  getTunnelStatus() {
    return {
      status: this.tunnelStatus,
      tunnelUrl: this.tunnelUrl,
      error: this.tunnelError,
    };
  }

  startTunnel(localPort = 5173) {
    if (this.tunnelProcess && this.tunnelUrl) {
      return Promise.resolve({
        success: true,
        tunnelUrl: this.tunnelUrl,
        alreadyRunning: true,
      });
    }

    this.stopTunnel();
    this.tunnelStatus = 'starting';
    this.tunnelError = null;
    this.tunnelUrl = null;

    const bin = getCloudflaredPath();

    return new Promise((resolve, reject) => {
      let resolved = false;

      try {
        this.tunnelProcess = spawn(bin, [
          'tunnel',
          '--url',
          `http://127.0.0.1:${localPort}`,
          '--http-host-header',
          `localhost:${localPort}`,
        ]);
      } catch (err) {
        this.tunnelStatus = 'error';
        this.tunnelError = String(err);
        return reject(err);
      }

      const onData = (data) => {
        const text = data.toString();
        const match = text.match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/);
        if (match && !resolved) {
          resolved = true;
          this.tunnelUrl = match[1];
          this.tunnelStatus = 'running';

          try {
            const outTxt = path.resolve(process.cwd(), 'active_tunnel_url.txt');
            fs.writeFileSync(outTxt, this.tunnelUrl);
          } catch {}

          resolve({
            success: true,
            tunnelUrl: this.tunnelUrl,
          });
        }
      };

      this.tunnelProcess.stdout.on('data', onData);
      this.tunnelProcess.stderr.on('data', onData);

      this.tunnelProcess.on('error', (err) => {
        this.tunnelStatus = 'error';
        this.tunnelError = err.message;
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      this.tunnelProcess.on('exit', () => {
        this.tunnelProcess = null;
        this.tunnelUrl = null;
        this.tunnelStatus = 'stopped';
      });

      // 25 second timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.tunnelStatus = 'error';
          this.tunnelError = 'Timeout waiting for Cloudflare Tunnel URL';
          reject(new Error(this.tunnelError));
        }
      }, 25000);
    });
  }

  stopTunnel() {
    if (this.tunnelProcess) {
      try {
        this.tunnelProcess.kill('SIGTERM');
      } catch {}
      this.tunnelProcess = null;
    }
    this.tunnelUrl = null;
    this.tunnelStatus = 'stopped';
    this.tunnelError = null;
    return { success: true };
  }

  async testTunnel() {
    if (!this.tunnelUrl) {
      return { success: false, reachable: false, error: 'No active tunnel running.' };
    }

    try {
      const startTime = Date.now();
      const res = await fetch(`${this.tunnelUrl}/api/remote/status`, {
        signal: AbortSignal.timeout(8000),
      });
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return { success: false, reachable: false, error: `HTTP ${res.status}` };
      }

      const data = await res.json();
      return {
        success: true,
        reachable: true,
        latencyMs,
        tunnelUrl: this.tunnelUrl,
        serverName: data.serverName,
        hardwareConnected: data.hardwareConnected,
        activePort: data.activePort,
      };
    } catch (err) {
      return {
        success: false,
        reachable: false,
        error: String(err && err.message ? err.message : err),
      };
    }
  }
}

const remoteLabManager = new RemoteLabManager();
module.exports = { remoteLabManager };
