// ============================================================
// Delta DTB9696 Modbus RTU & Remote Lab Service
// ============================================================
// Supports:
// 1. Local Hardware communication via local Modbus RTU daemon
// 2. Remote Lab Client over Internet (via Host URL & Session Token)
// 3. Virtual Simulation fallback
// 4. Hardware Simulator (Ctrl+Shift+S) — no physical hardware needed
// ============================================================

import { RemoteLabClient } from '../remoteLab/remoteLabService';
import { hardwareSimulator } from '../hardwareSimulator';

export interface ModbusConnectionResult {
  success: boolean;
  portName: string;
  message: string;
  txFrame?: string;
  rxFrame?: string;
  error?: string;
  isRemote?: boolean;
}

export interface ModbusLiveState {
  connected: boolean;
  timestamp: number;
  pv: number;
  sp: number;
  pb: number;
  it: number;
  dt: number;
  bias: number;
  op: number;
  action: 'Direct' | 'Reverse';
  autoMan: 'Auto' | 'Manual';
  raw?: Record<string, number>;
}

export class DeltaDTBService {
  private static instance: DeltaDTBService;
  private isConnected = false;
  private currentPort = '';
  private isHardwareConnected = false;
  private isRemoteMode = false;
  private baseUrl = '';
  private sessionToken = '';
  private pollIntervalId: number | null = null;
  private onPollCallbacks: Array<(state: ModbusLiveState) => void> = [];
  private onRevokedCallbacks: Array<() => void> = [];

  public static getInstance(): DeltaDTBService {
    if (!DeltaDTBService.instance) {
      DeltaDTBService.instance = new DeltaDTBService();
    }
    return DeltaDTBService.instance;
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public getCurrentPort(): string {
    return this.currentPort;
  }

  public isHardware(): boolean {
    return this.isHardwareConnected;
  }

  public isRemote(): boolean {
    return this.isRemoteMode;
  }

  public onSessionRevoked(cb: () => void) {
    this.onRevokedCallbacks.push(cb);
    return () => {
      this.onRevokedCallbacks = this.onRevokedCallbacks.filter((c) => c !== cb);
    };
  }

  private triggerRevoked() {
    this.isConnected = false;
    this.isHardwareConnected = false;
    this.isRemoteMode = false;
    this.stopPolling();
    for (const cb of this.onRevokedCallbacks) {
      cb();
    }
  }

  /**
   * Connects to Local Serial Port via local Modbus daemon and verifies Action register handshake.
   * If Hardware Simulator is active, skips real hardware and returns a virtual success.
   */
  public async connect(
    portName: string,
    slaveId = 1,
    action: 'Direct' | 'Reverse' = 'Direct'
  ): Promise<ModbusConnectionResult> {
    // ── Hardware Simulator bypass ──────────────────────────────────────────
    if (hardwareSimulator.isActive) {
      this.isConnected = true;
      this.currentPort = portName;
      this.isHardwareConnected = true;
      const result = hardwareSimulator.simulateModbusConnect(portName);
      return {
        success: true,
        portName,
        isRemote: false,
        message: result.message,
        txFrame: 'SIM 01 06 10 06 00 01',
        rxFrame: 'SIM 01 06 10 06 00 01',
      };
    }

    this.baseUrl = '';
    this.sessionToken = '';
    this.isRemoteMode = false;

    try {
      const res = await fetch('/api/modbus/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portName, baud: 9600, slaveId, action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.isConnected = true;
        this.currentPort = portName;
        this.isHardwareConnected = true;

        return {
          success: true,
          portName,
          isRemote: false,
          message: data.message || `Connected to ${portName}. Action register handshake verified.`,
          txFrame: '01 06 10 06 00 01 6D 08',
          rxFrame: '01 06 10 06 00 01 6D 08',
        };
      } else {
        this.isConnected = false;
        this.currentPort = '';
        this.isHardwareConnected = false;
        return {
          success: false,
          portName,
          isRemote: false,
          error: data.error || 'Connection failed',
          message: data.error || 'Delta DTB9696 controller did not respond to Action handshake (address 4102).',
        };
      }
    } catch (err: unknown) {
      this.isConnected = false;
      this.currentPort = '';
      this.isHardwareConnected = false;
      return {
        success: false,
        portName,
        isRemote: false,
        error: String(err),
        message: `Failed to connect to ${portName}: ${String(err)}`,
      };
    }
  }

  /**
   * Connects to a Remote Lab Host over the Internet
   */
  public async connectRemote(
    hostUrl: string,
    passkey: string,
    studentName: string
  ): Promise<ModbusConnectionResult> {
    const client = RemoteLabClient.getInstance();
    const cleanUrl = client.normalizeUrl(hostUrl);

    try {
      const auth = await client.login(cleanUrl, passkey, studentName);
      if (!auth.success || !auth.token) {
        return {
          success: false,
          portName: '',
          message: auth.error || 'Authentication failed. Please verify the Passkey.',
          error: auth.error,
        };
      }

      this.baseUrl = cleanUrl;
      this.sessionToken = auth.token;
      this.isRemoteMode = true;
      this.isConnected = true;
      this.isHardwareConnected = Boolean(auth.hardwareConnected);
      this.currentPort = `Remote Lab (${cleanUrl.replace(/^https?:\/\//, '')})`;

      // Listen for remote revocation
      client.setOnRevoked(() => {
        this.triggerRevoked();
      });

      return {
        success: true,
        portName: this.currentPort,
        isRemote: true,
        message: `Connected to Remote Lab Host at ${cleanUrl}. Student: ${studentName}. Live hardware stream active!`,
        txFrame: '01 03 10 00 00 02 C0 CB',
        rxFrame: '01 03 04 00 13 01 F4 0B E1',
      };
    } catch (err: unknown) {
      return {
        success: false,
        portName: '',
        message: `Cannot reach Remote Lab Host at ${cleanUrl}. Ensure host is online. (${String(err)})`,
        error: String(err),
      };
    }
  }

  public startPolling() {
    if (this.pollIntervalId) return;

    // ── Hardware Simulator polling path ────────────────────────────────────
    if (hardwareSimulator.isActive) {
      // Register to receive simulated poll events from the simulator engine
      const unsubSim = hardwareSimulator.onModbusPoll((rawState: object) => {
        const state = rawState as ModbusLiveState;
        for (const cb of this.onPollCallbacks) {
          cb(state);
        }
      });
      // Store unsubscribe fn in pollIntervalId slot via a shim (set a dummy id)
      this.pollIntervalId = window.setInterval(() => {}, 86400000);
      // Keep the unsubscribe fn accessible
      (this as unknown as { _simUnsub?: () => void })._simUnsub = unsubSim;
      return;
    }

    this.pollIntervalId = window.setInterval(async () => {
      if (!this.isConnected) return;

      try {
        const url = this.baseUrl ? `${this.baseUrl}/api/modbus/poll` : '/api/modbus/poll';
        const headers: Record<string, string> = {};
        if (this.sessionToken) {
          headers['x-session-token'] = this.sessionToken;
        }

        const res = await fetch(url, { headers });
        if (res.status === 401) {
          // Access revoked by host!
          this.triggerRevoked();
          return;
        }

        if (res.ok) {
          const liveState: ModbusLiveState = await res.json();
          for (const cb of this.onPollCallbacks) {
            cb(liveState);
          }
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    }, 1000); // 1-second sampling rate
  }

  public stopPolling() {
    const simUnsub = (this as unknown as { _simUnsub?: () => void })._simUnsub;
    if (simUnsub) {
      simUnsub();
      (this as unknown as { _simUnsub?: () => void })._simUnsub = undefined;
    }
    if (this.pollIntervalId) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  public isPolling(): boolean {
    return this.pollIntervalId !== null;
  }

  public onLivePoll(cb: (state: ModbusLiveState) => void) {
    this.onPollCallbacks.push(cb);
    return () => {
      this.onPollCallbacks = this.onPollCallbacks.filter((c) => c !== cb);
    };
  }

  public async writeRegister(
    register: string,
    value: number | string,
    slaveId = 1
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    // ── Hardware Simulator write bypass ───────────────────────────────────
    if (hardwareSimulator.isActive) {
      hardwareSimulator.writeRegister(register, value);
      return true;
    }

    try {
      const url = this.baseUrl ? `${this.baseUrl}/api/modbus/write` : '/api/modbus/write';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.sessionToken) {
        headers['x-session-token'] = this.sessionToken;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slaveId, register, value }),
      });

      if (res.status === 401) {
        this.triggerRevoked();
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        return Boolean(data.success);
      }
    } catch (err) {
      console.error('Modbus write error:', err);
    }
    return false;
  }

  public async disconnect(): Promise<void> {
    this.stopPolling();
    if (this.isConnected) {
      if (!this.isRemoteMode && this.isHardwareConnected) {
        try {
          await fetch('/api/modbus/disconnect', { method: 'POST' });
        } catch {
          // ignore
        }
      }
      RemoteLabClient.getInstance().disconnect();
    }
    this.isConnected = false;
    this.currentPort = '';
    this.isHardwareConnected = false;
    this.isRemoteMode = false;
    this.baseUrl = '';
    this.sessionToken = '';
  }
}
