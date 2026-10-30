// ============================================================
// ACE Prosoft — Hardware Simulator Service
// ============================================================
// Provides a virtual hardware layer that mimics both:
//   1. Delta DTB9696 Modbus RTU (used in ACE 101)
//   2. ACE 2007 WiFi DAQ TCP (used in ACE 106)
//
// When active (Ctrl + Shift + S on the Home page), all modules
// function exactly as they would with real hardware, with the
// PV updated through built-in process dynamics simulation.
// ============================================================

type SimulatorListener = (isActive: boolean) => void;

export class HardwareSimulatorService {
  private static instance: HardwareSimulatorService;
  private _isActive: boolean = false;
  private _listeners: SimulatorListener[] = [];

  // Simulated process state (shared between DTB / TCP modules)
  private _pv: number = 0.0;
  private _sp: number = 50.0;
  private _op: number = 0.0;
  private _pb: number = 20.0;
  private _it: number = 30.0;
  private _dt: number = 1.0;
  private _bias: number = 40.0;
  private _action: 'Direct' | 'Reverse' = 'Reverse';
  private _autoMan: 'Auto' | 'Manual' = 'Auto';
  private _integralError: number = 0.0;
  private _prevError: number = 0.0;
  private _lastExternalOpTime: number = 0;

  // Virtual TCP channel data
  private _ip0: number = 0.0;
  private _ip1: number = 0.0;
  private _ip2: number = 0.0;
  private _ip3: number = 0.0;
  private _op0: number = 0.0;
  private _op1: number = 0.0;
  private _moduleName: string = 'ACE2007-2';

  // Internal simulation interval
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _tcpPollCallbacks: Array<(state: object) => void> = [];
  private _modbusPollCallbacks: Array<(state: object) => void> = [];

  public static getInstance(): HardwareSimulatorService {
    if (!HardwareSimulatorService.instance) {
      HardwareSimulatorService.instance = new HardwareSimulatorService();
    }
    return HardwareSimulatorService.instance;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  // ── Subscribe/Unsubscribe to simulator state changes ──────────────
  public subscribe(listener: SimulatorListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  private _notify() {
    for (const l of this._listeners) {
      l(this._isActive);
    }
  }

  // ── Toggle Hardware Simulator On/Off ──────────────────────────────
  public toggle(): boolean {
    this._isActive = !this._isActive;
    if (this._isActive) {
      this._startSimulation();
    } else {
      this._stopSimulation();
    }
    this._notify();
    return this._isActive;
  }

  public activate(): void {
    if (!this._isActive) {
      this._isActive = true;
      this._startSimulation();
      this._notify();
    }
  }

  public deactivate(): void {
    if (this._isActive) {
      this._isActive = false;
      this._stopSimulation();
      this._notify();
    }
  }

  // ── Internal process simulation loop (1000ms / 1 second sampling default) ──
  private _startSimulation(): void {
    if (this._intervalId !== null) return;
    // Reset PV each time simulator is activated
    this._pv = 0.0;
    this._integralError = 0.0;
    this._prevError = 0.0;
    this._op = 0.0;
    this._lastExternalOpTime = 0;

    this._intervalId = setInterval(() => {
      this._step();
    }, 1000);
  }

  private _stopSimulation(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._pv = 0.0;
    this._op = 0.0;
    this._ip0 = 0.0;
    this._ip2 = 0.0;
    this._tcpPollCallbacks = [];
    this._modbusPollCallbacks = [];
  }

  // ── Compute one simulation step (PID + level process dynamics) ────
  private _step(): void {
    const dt = 1.0; // 1 second per step (default hardware execution rate)

    // If no external OP has been commanded by the host software in the last 2 seconds
    // and controller is in Auto, simulate Delta DTB's internal PID loop:
    const isExternallyControlled = Date.now() - this._lastExternalOpTime < 2000;

    if (!isExternallyControlled && this._autoMan === 'Auto') {
      const err =
        this._action === 'Reverse'
          ? this._sp - this._pv
          : this._pv - this._sp;

      const pb = Math.max(this._pb, 0.001);
      const kp = 100 / pb;

      if (this._it > 0) {
        this._integralError += err * dt;
        this._integralError = Math.max(-50, Math.min(50, this._integralError));
      } else {
        this._integralError = 0;
      }

      const derivative = this._dt > 0 ? (err - this._prevError) / dt : 0;
      this._prevError = err;

      const newOp =
        this._bias +
        kp * (err + (1 / Math.max(this._it, 1)) * this._integralError + this._dt * derivative);
      this._op = Math.max(0, Math.min(100, newOp));
    }

    // Level Process Dynamics (Inflow from OP valve, outflow via drain nozzle):
    const finNorm = this._op / 100;
    const fin = finNorm * 8.0; // max inflow rate
    const fout = 0.8 * Math.sqrt(Math.max(this._pv, 0)); // gravitational discharge
    const dPv = (fin - fout) * 0.5 * dt;
    this._pv = Math.max(0, Math.min(100, this._pv + dPv));

    // Sync channel data
    this._ip0 = this._pv;
    this._ip2 = this._pv;
    this._op0 = this._op;

    // Emit to any registered TCP poll listeners
    const tcpState = this._buildTcpState();
    for (const cb of this._tcpPollCallbacks) {
      cb(tcpState);
    }

    // Emit to any registered Modbus poll listeners
    const modbusState = this._buildModbusState();
    for (const cb of this._modbusPollCallbacks) {
      cb(modbusState);
    }
  }

  // ── Build virtual live state objects ──────────────────────────────
  private _buildTcpState(): object {
    return {
      connected: true,
      timestamp: Date.now(),
      host: '192.168.0.1',
      port: 8080,
      pv: Number(this._pv.toFixed(1)),
      sp: Number(this._sp.toFixed(1)),
      pb: Number(this._pb.toFixed(1)),
      it: Number(this._it.toFixed(1)),
      dt: Number(this._dt.toFixed(1)),
      bias: Number(this._bias.toFixed(1)),
      op: Number(this._op.toFixed(1)),
      op0: Number(this._op0.toFixed(1)),
      op1: Number(this._op1.toFixed(1)),
      ip0: Number(this._ip0.toFixed(1)),
      ip1: Number(this._ip1.toFixed(1)),
      ip2: Number(this._ip2.toFixed(1)),
      ip3: Number(this._ip3.toFixed(1)),
      moduleName: this._moduleName,
      action: this._action,
      autoMan: this._autoMan,
      raw: {
        raw0: Math.round(this._ip0 * 40.95), // 12-bit ADC value (0-4095)
        raw1: Math.round(this._ip1 * 40.95),
        raw2: Math.round(this._ip2 * 40.95),
        raw3: Math.round(this._ip3 * 40.95),
      },
    };
  }

  private _buildModbusState(): object {
    return {
      connected: true,
      timestamp: Date.now(),
      pv: Number(this._pv.toFixed(1)),
      sp: Number(this._sp.toFixed(1)),
      pb: Number(this._pb.toFixed(1)),
      it: Number(this._it.toFixed(1)),
      dt: Number(this._dt.toFixed(1)),
      bias: Number(this._bias.toFixed(1)),
      op: Number(this._op.toFixed(1)),
      action: this._action,
      autoMan: this._autoMan,
    };
  }

  // ── Register polling listeners (called by DTB / TCP services) ─────
  public onTcpPoll(cb: (state: object) => void): () => void {
    this._tcpPollCallbacks.push(cb);
    return () => {
      this._tcpPollCallbacks = this._tcpPollCallbacks.filter((c) => c !== cb);
    };
  }

  public onModbusPoll(cb: (state: object) => void): () => void {
    this._modbusPollCallbacks.push(cb);
    return () => {
      this._modbusPollCallbacks = this._modbusPollCallbacks.filter((c) => c !== cb);
    };
  }

  // ── Register writes from the UI to the virtual controller ─────────
  public writeRegister(param: string, value: number | string): void {
    const key = param.toLowerCase();
    if (key === 'sp') {
      this._sp = Math.max(0, Math.min(100, Number(value) || 0));
    } else if (key === 'pb') {
      this._pb = Math.max(0.001, Number(value) || 20);
    } else if (key === 'it') {
      this._it = Math.max(0, Number(value) || 0);
    } else if (key === 'dt') {
      this._dt = Math.max(0, Number(value) || 0);
    } else if (key === 'bias') {
      this._bias = Math.max(0, Math.min(100, Number(value) || 0));
    } else if (key === 'action') {
      this._action = value === 'Reverse' || value === 0 ? 'Reverse' : 'Direct';
    } else if (key === 'automan') {
      this._autoMan = value === 'Manual' || value === 2 ? 'Manual' : 'Auto';
      if (this._autoMan === 'Manual') {
        this._integralError = 0;
        this._prevError = 0;
      }
    } else if (key === 'op') {
      const newOp = Math.max(0, Math.min(100, Number(value) || 0));
      this._op = newOp;
      this._op0 = newOp;
      this._lastExternalOpTime = Date.now();
    }
  }

  public writeOutput(op0: number, op1 = 0): void {
    this._op0 = Math.max(0, Math.min(100, op0));
    this._op1 = Math.max(0, Math.min(100, op1));
    this._op = this._op0;
    this._lastExternalOpTime = Date.now();
  }

  // ── Virtual TCP connect/disconnect (used by Ace2007TcpService) ────
  public simulateTcpConnect(): { success: boolean; message: string } {
    return {
      success: true,
      message: `[Hardware Simulator] Connected to virtual ACE 2007 DAQ at 192.168.0.1:8080`,
    };
  }

  public simulateModbusConnect(portName: string): { success: boolean; message: string } {
    return {
      success: true,
      message: `[Hardware Simulator] Connected to virtual Delta DTB9696 on ${portName}`,
    };
  }

  // Expose current PV / SP / OP for direct reads
  public getState() {
    return {
      pv: this._pv,
      sp: this._sp,
      op: this._op,
      pb: this._pb,
      it: this._it,
      dt: this._dt,
      bias: this._bias,
      action: this._action,
      autoMan: this._autoMan,
    };
  }
}

export const hardwareSimulator = HardwareSimulatorService.getInstance();
