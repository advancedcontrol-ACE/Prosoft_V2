// ============================================================
// Remote Lab Service: API client for Remote Students and Host Monitor
// ============================================================

export interface RemoteSession {
  token: string;
  studentName: string;
  clientIp: string;
  connectedAt: number;
  lastSeen: number;
  lastAction: string;
  status: 'active' | 'revoked';
}

export interface RemoteStatusResponse {
  success: boolean;
  serverName: string;
  hardwareConnected: boolean;
  activePort: string;
  passkeyRequired: boolean;
}

export interface RemoteAuthResponse {
  success: boolean;
  token?: string;
  studentName?: string;
  serverTime?: number;
  hardwareConnected?: boolean;
  activePort?: string;
  error?: string;
}

export interface RemoteSessionsResponse {
  success: boolean;
  passkey: string;
  sessions: RemoteSession[];
}

export class RemoteLabClient {
  private static instance: RemoteLabClient;
  private currentHostUrl = '';
  private currentSessionToken = '';
  private studentName = '';
  private onRevokedCallback: (() => void) | null = null;

  public static getInstance(): RemoteLabClient {
    if (!RemoteLabClient.instance) {
      RemoteLabClient.instance = new RemoteLabClient();
    }
    return RemoteLabClient.instance;
  }

  public getHostUrl(): string {
    return this.currentHostUrl;
  }

  public getSessionToken(): string {
    return this.currentSessionToken;
  }

  public getStudentName(): string {
    return this.studentName;
  }

  public isRemoteConnected(): boolean {
    return Boolean(this.currentHostUrl && this.currentSessionToken);
  }

  public setOnRevoked(cb: () => void) {
    this.onRevokedCallback = cb;
  }

  public triggerRevoked() {
    this.currentHostUrl = '';
    this.currentSessionToken = '';
    if (this.onRevokedCallback) {
      this.onRevokedCallback();
    }
  }

  /**
   * Cleans and formats the host URL (strips trailing slash, adds http/https if missing)
   */
  public normalizeUrl(url: string): string {
    let cleaned = (url || '').trim();
    if (!cleaned) return '';
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'http://' + cleaned;
    }
    return cleaned.replace(/\/+$/, '');
  }

  /**
   * Check status of a remote host server
   */
  public async checkStatus(hostUrl?: string): Promise<RemoteStatusResponse> {
    const base = this.normalizeUrl(hostUrl || this.currentHostUrl);
    const res = await fetch(`${base}/api/remote/status`);
    if (!res.ok) {
      throw new Error(`Host returned HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Authenticate student with passkey
   */
  public async login(
    hostUrl: string,
    passkey: string,
    studentName: string
  ): Promise<RemoteAuthResponse> {
    const base = this.normalizeUrl(hostUrl);
    const res = await fetch(`${base}/api/remote/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey, studentName }),
    });

    const data: RemoteAuthResponse = await res.json();
    if (data.success && data.token) {
      this.currentHostUrl = base;
      this.currentSessionToken = data.token;
      this.studentName = studentName;
    }
    return data;
  }

  /**
   * Host queries connected student sessions
   */
  public async fetchSessions(hostUrl?: string): Promise<RemoteSessionsResponse> {
    const base = this.normalizeUrl(hostUrl || this.currentHostUrl);
    const res = await fetch(`${base}/api/remote/sessions`);
    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Host revokes student access
   */
  public async revokeSession(token: string, hostUrl?: string): Promise<boolean> {
    const base = this.normalizeUrl(hostUrl || this.currentHostUrl);
    const res = await fetch(`${base}/api/remote/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.success);
  }

  /**
   * Host updates the access passkey
   */
  public async setPasskey(passkey: string, hostUrl?: string): Promise<string> {
    const base = this.normalizeUrl(hostUrl || this.currentHostUrl);
    const res = await fetch(`${base}/api/remote/set-passkey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey }),
    });
    if (!res.ok) throw new Error('Failed to update passkey');
    const data = await res.json();
    return data.passkey;
  }

  public disconnect() {
    this.currentHostUrl = '';
    this.currentSessionToken = '';
    this.studentName = '';
  }
}
