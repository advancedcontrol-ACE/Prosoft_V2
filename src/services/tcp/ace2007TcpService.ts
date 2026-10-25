// ============================================================
// ACE 2007 TCP DAQ Client Service
// ============================================================
// Connects to ACE 2007 DAQ Module over TCP (Ethernet / Wi-Fi)
// Protocol from ACE2007.pdf & ACE2007.py:
//   Output: 1<OP0_3digit>2<OP1_3digit>.
//   Input:  1<IP0_4digit>2<IP1_4digit>3<IP2_4digit>4<IP3_4digit>...
// Also supports Hardware Simulator mode (Ctrl+Shift+S).
// ============================================================

export interface TcpConnectionResult {
  success: boolean;
  message: string;
  host: string;
  port: number;
  error?: string;
}

export interface TcpLiveState {
  connected: boolean;
  timestamp: number;
  host: string;
  port: number;
  pv: number;
  sp: number;
  pb: number;
  it: number;
  dt: number;
  bias: number;
  op: number;
  op0: number;
  op1: number;
  ip0: number;
  ip1: number;
  ip2: number;
  ip3: number;
  moduleName?: string;
  action: 'Direct' | 'Reverse';
  autoMan: 'Auto' | 'Manual';
  raw?: Record<string, number>;
}

import { RemoteLabClient } from '../remoteLab/remoteLabService';
import { hardwareSimulator } from '../hardwareSimulator';

export class Ace2007TcpService {
  private static instance: Ace2007TcpService;
  private isConnected = false;
  private host = '192.168.0.1';
  private port = 8080;
  private currentPort = '';
  private isRemoteMode = false;
  private baseUrl = '';
  private sessionToken = '';
  private onRevokedCallback: (() => void) | null = null;
  private pollIntervalId: number | null = null;
  private onPollCallbacks: Array<(state: TcpLiveState) => void> = [];

  // Local control state for Level PID
  private sp = 50.0;
  private pb = 20.0;
  private it = 30;
  private dt = 1;
  private bias = 40.0;
  private op = 0.0;
  private autoMan: 'Auto' | 'Manual' = 'Auto';
  private action: 'Direct' | 'Reverse' = 'Direct';

  public static getInstance(): Ace2007TcpService {
    if (!Ace2007TcpService.instance) {
      Ace2007TcpService.instance = new Ace2007TcpService();
    }
    return Ace2007TcpService.instance;
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public getCurrentHost(): string {
    return this.host;
  }

  public getCurrentPort(): number {
    return this.port;
  }

  public isHardware(): boolean {
    return this.isConnected;
  }

  public isRemote(): boolean {
    return this.isRemoteMode;
  }

  public getActivePort(): string {
    return this.currentPort || (this.isConnected ? `${this.host}:${this.port} (TCP)` : '');
  }

  public setOnRevoked(cb: () => void) {
    this.onRevokedCallback = cb;
  }

  public triggerRevoked() {
    this.stopPolling();
    this.isConnected = false;
    this.isRemoteMode = false;
    this.sessionToken = '';
    this.baseUrl = '';
    this.currentPort = '';
    if (this.onRevokedCallback) {
      this.onRevokedCallback();
    }
  }

  /**
   * Connect to ACE 2007 DAQ via TCP.
   * If Hardware Simulator is active, skips real network and returns virtual success.
   */
  public async connect(host = '192.168.0.1', port = 8080): Promise<TcpConnectionResult> {
    // ── Hardware Simulator bypass ──────────────────────────────────────────
    if (hardwareSimulator.isActive) {
      this.isConnected = true;
      this.host = host;
      this.port = port;
      this.currentPort = `SIM:${host}:${port}`;
      const result = hardwareSimulator.simulateTcpConnect();
      this.startPolling(250);
      return {
        success: true,
        host,
        port,
        message: result.message,
      };
    }

    try {
      const res = await fetch('/api/tcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.isConnected = true;
        this.host = host;
        this.port = port;
        this.startPolling(250);

        return {
          success: true,
          host,
          port,
          message: data.message || `Connected to ACE 2007 DAQ at ${host}:${port} (TCP)`,
        };
      } else {
        this.isConnected = false;
        return {
          success: false,
          host,
          port,
          error: data.error || 'Connection failed',
          message: data.message || `Failed to connect to ACE 2007 DAQ at ${host}:${port}`,
        };
      }
    } catch (err: unknown) {
      this.isConnected = false;
      return {
        success: false,
        host,
        port,
        error: String(err),
        message: `Failed to connect to ${host}:${port}: ${String(err)}`,
      };
    }
  }

  /**
   * Connect to Remote Lab Host over Local Network or Cloudflare Tunnel (Student Mode)
   */
  public async connectRemote(
    targetUrl: string,
    passkey: string,
    studentName = 'Student'
  ): Promise<{ success: boolean; portName: string; isRemote?: boolean; message: string; error?: string }> {
    try {
      const cleanUrl = targetUrl.trim().replace(/\/+$/, '');
      const client = RemoteLabClient.getInstance();
      const auth = await client.login(cleanUrl, passkey, studentName);
      if (!auth.success || !auth.token) {
        return {
          success: false,
          portName: '',
          message: auth.error || 'Authentication failed. Check passkey or host status.',
        };
      }

      this.baseUrl = cleanUrl;
      this.sessionToken = auth.token;
      this.isRemoteMode = true;
      this.isConnected = true;
      this.host = cleanUrl.replace(/^https?:\/\//, '');
      this.currentPort = `Remote Lab (${this.host})`;

      // Listen for remote revocation
      client.setOnRevoked(() => {
        this.triggerRevoked();
      });

      this.startPolling(250);

      return {
        success: true,
        portName: this.currentPort,
        isRemote: true,
        message: `Connected to Remote Lab Host at ${cleanUrl}. Student: ${studentName}. Live hardware stream active!`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        portName: '',
        message: `Cannot reach Remote Lab Host at ${targetUrl}. Ensure host is online. (${String(err)})`,
        error: String(err),
      };
    }
  }

  public async disconnect(): Promise<void> {
    this.stopPolling();
    this.isConnected = false;
    this.isRemoteMode = false;
    this.sessionToken = '';
    this.baseUrl = '';
    this.currentPort = '';
    try {
      await fetch('/api/tcp/disconnect', { method: 'POST' });
    } catch {
      // ignore
    }
  }

  public startPolling(intervalMs = 250) {
    this.stopPolling();

    // ── Hardware Simulator polling path ────────────────────────────────────
    if (hardwareSimulator.isActive) {
      const unsubSim = hardwareSimulator.onTcpPoll((rawState: object) => {
        const data = rawState as TcpLiveState;
        const liveState: TcpLiveState = {
          connected: true,
          timestamp: data.timestamp || Date.now(),
          host: this.host,
          port: this.port,
          pv: data.ip2 ?? data.pv ?? 0,
          sp: this.sp,
          pb: this.pb,
          it: this.it,
          dt: this.dt,
          bias: this.bias,
          op: data.op ?? this.op,
          op0: data.op0 ?? this.op,
          op1: data.op1 ?? 0,
          ip0: data.ip0 ?? 0,
          ip1: data.ip1 ?? 0,
          ip2: data.ip2 ?? 0,
          ip3: data.ip3 ?? 0,
          moduleName: data.moduleName ?? 'SIM-ACE2007-1',
          action: this.action,
          autoMan: this.autoMan,
          raw: (data as TcpLiveState).raw,
        };
        for (const cb of this.onPollCallbacks) {
          cb(liveState);
        }
      });
      // Store dummy interval to indicate polling is active
      this.pollIntervalId = window.setInterval(() => {}, 86400000);
      (this as unknown as { _simUnsub?: () => void })._simUnsub = unsubSim;
      return;
    }

    this.pollIntervalId = window.setInterval(async () => {
      if (!this.isConnected) return;
      try {
        const url = this.baseUrl ? `${this.baseUrl}/api/tcp/poll` : '/api/tcp/poll';
        const headers: Record<string, string> = {};
        if (this.sessionToken) {
          headers['x-session-token'] = this.sessionToken;
        }

        const res = await fetch(url, { headers });
        if (res.status === 401) {
          // Access revoked by host
          this.triggerRevoked();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            this.isConnected = Boolean(data.connected);
            const liveState: TcpLiveState = {
              connected: this.isConnected,
              timestamp: data.timestamp || Date.now(),
              host: this.host,
              port: this.port,
              pv: typeof data.pv === 'number' ? data.pv : (typeof data.ip2 === 'number' ? data.ip2 : 0.0),
              sp: this.sp,
              pb: this.pb,
              it: this.it,
              dt: this.dt,
              bias: this.bias,
              op: typeof data.op === 'number' ? data.op : this.op,
              op0: typeof data.op0 === 'number' ? data.op0 : this.op,
              op1: typeof data.op1 === 'number' ? data.op1 : 0.0,
              ip0: typeof data.ip0 === 'number' ? data.ip0 : 0.0,
              ip1: typeof data.ip1 === 'number' ? data.ip1 : 0.0,
              ip2: typeof data.ip2 === 'number' ? data.ip2 : 0.0,
              ip3: typeof data.ip3 === 'number' ? data.ip3 : 0.0,
              moduleName: typeof data.moduleName === 'string' ? data.moduleName : 'ACE2007-2',
              action: this.action,
              autoMan: this.autoMan,
              raw: data.raw,
            };

            for (const cb of this.onPollCallbacks) {
              cb(liveState);
            }
          }
        }
      } catch {
        // network polling drop
      }
    }, intervalMs);
  }

  public stopPolling() {
    const simUnsub = (this as unknown as { _simUnsub?: () => void })._simUnsub;
    if (simUnsub) {
      simUnsub();
      (this as unknown as { _simUnsub?: () => void })._simUnsub = undefined;
    }
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  public onLivePoll(cb: (state: TcpLiveState) => void) {
    this.onPollCallbacks.push(cb);
    return () => {
      this.onPollCallbacks = this.onPollCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Send OP Output (Channel 1) and OP1 (Channel 2) to DAQ
   */
  public async writeOutput(op0: number, op1 = 0): Promise<void> {
    this.op = Math.max(0, Math.min(100, op0));

    // ── Hardware Simulator write bypass ───────────────────────────────────
    if (hardwareSimulator.isActive) {
      hardwareSimulator.writeOutput(this.op, op1);
      return;
    }

    try {
      const url = this.baseUrl ? `${this.baseUrl}/api/tcp/write` : '/api/tcp/write';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.sessionToken) {
        headers['x-session-token'] = this.sessionToken;
      }
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ op: this.op, op0: this.op, op1 }),
      });
    } catch {
      // ignore
    }
  }

  /**
   * Update software control registers
   */
  public async writeRegister(param: string, value: unknown): Promise<void> {
    const key = param.toLowerCase();
    if (key === 'sp') {
      this.sp = Number(value) || 0;
    } else if (key === 'pb') {
      this.pb = Number(value) || 20;
    } else if (key === 'it') {
      this.it = Number(value) || 0;
    } else if (key === 'dt') {
      this.dt = Number(value) || 0;
    } else if (key === 'bias') {
      this.bias = Number(value) || 0;
    } else if (key === 'action') {
      this.action = value === 'Reverse' || value === 0 ? 'Reverse' : 'Direct';
    } else if (key === 'automan') {
      this.autoMan = value === 'Manual' || value === 2 ? 'Manual' : 'Auto';
    } else if (key === 'op') {
      this.op = Number(value) || 0;
      await this.writeOutput(this.op);
    }

    // ── Hardware Simulator write bypass ───────────────────────────────────
    if (hardwareSimulator.isActive) {
      hardwareSimulator.writeRegister(param, value as number | string);
    }
  }
}
