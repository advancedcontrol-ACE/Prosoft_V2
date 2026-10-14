// ============================================================
// Remote Lab Manager: Session Management, Passkey Auth & Monitoring
// ============================================================

class RemoteLabManager {
  constructor() {
    this.passkey = 'ACE-101';
    this.allowRemote = true;
    // Map of token -> session object
    this.sessions = new Map();
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

    // Generate unique session token
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
    // Return sessions as array, sorted by latest activity
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

  clearRevokedSessions() {
    for (const [token, s] of this.sessions.entries()) {
      if (s.status === 'revoked') {
        this.sessions.delete(token);
      }
    }
    return true;
  }
}

const remoteLabManager = new RemoteLabManager();
module.exports = { remoteLabManager };
