const { spawn } = require('child_process');
const path = require('path');

class ModbusBridge {
  constructor() {
    this.ps = null;
    this.isConnected = false;
    this.currentPort = '';
    this.slaveId = 1;
    this.latestData = {
      connected: false,
      timestamp: Date.now(),
      pv: 0.0,
      sp: 0.0,
      pb: 20.0,
      it: 30,
      dt: 1,
      bias: 0.0,
      op: 0.0,
      action: 'Direct',
      autoMan: 'Auto',
      raw: {},
    };
    this.pollTimer = null;
    this.isPolling = false;
    this.daemonReady = false;
    this.responseQueue = [];
    this.lineBuffer = '';
  }

  startDaemon() {
    if (this.ps) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const fs = require('fs');
      let scriptPath = path.resolve(__dirname, 'modbus_daemon.ps1');
      if (process.resourcesPath) {
        const resPath = path.join(process.resourcesPath, 'modbus_daemon.ps1');
        if (fs.existsSync(resPath)) {
          scriptPath = resPath;
        }
      }
      this.ps = spawn('powershell', [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        scriptPath,
      ]);

      const onData = (chunk) => {
        this.lineBuffer += chunk.toString();
        const lines = this.lineBuffer.split(/[\r\n]+/);
        this.lineBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line.trim());
            if (parsed.status === 'ready') {
              this.daemonReady = true;
              resolve();
              continue;
            }
            if (this.responseQueue.length > 0) {
              const { resolver } = this.responseQueue.shift();
              resolver(parsed);
            }
          } catch {
            // non-json output
          }
        }
      };

      this.ps.stdout.on('data', onData);
      this.ps.stderr.on('data', (d) => {
        console.error('[ModbusDaemon ERR]', d.toString());
      });

      this.ps.on('exit', () => {
        this.ps = null;
        this.daemonReady = false;
        this.isConnected = false;
      });

      setTimeout(() => {
        if (!this.daemonReady) {
          reject(new Error('Timeout starting PowerShell Modbus daemon'));
        }
      }, 5000);
    });
  }

  sendCommand(cmdObj, timeoutMs = 1200) {
    return new Promise((resolve, reject) => {
      if (!this.ps || !this.daemonReady) {
        return reject(new Error('Daemon not ready'));
      }

      const timer = setTimeout(() => {
        const idx = this.responseQueue.findIndex((item) => item.timer === timer);
        if (idx !== -1) {
          this.responseQueue.splice(idx, 1);
        }
        reject(new Error('Modbus daemon response timeout'));
      }, timeoutMs);

      this.responseQueue.push({ resolver: resolve, timer });
      this.ps.stdin.write(JSON.stringify(cmdObj) + '\n');
    });
  }

  async connect(portName = 'COM4', baud = 9600, slaveId = 1) {
    await this.startDaemon();
    this.slaveId = slaveId || 1;
    const res = await this.sendCommand({ cmd: 'open', port: portName, baud });
    if (res.status === 'opened') {
      this.isConnected = true;
      this.currentPort = portName;
      this.latestData.connected = true;

      // Start 1-second continuous poll loop
      this.startPollingLoop();

      return {
        success: true,
        portName,
        message: `Connected to ${portName} at ${baud} bps. Modbus communication active.`,
      };
    } else {
      throw new Error(res.error || 'Failed to open serial port');
    }
  }

  startPollingLoop() {
    if (this.pollTimer) clearInterval(this.pollTimer);

    const doPoll = async () => {
      if (!this.isConnected || this.isPolling) return;
      this.isPolling = true;
      try {
        const res = await this.sendCommand({ cmd: 'poll_all', slaveId: this.slaveId }, 1500);
        if (res.status === 'ok') {
          this.latestData = {
            connected: true,
            timestamp: res.timestamp || Date.now(),
            pv: res.pv,
            sp: res.sp,
            pb: res.pb,
            it: res.it,
            dt: res.dt,
            bias: res.bias,
            op: res.op,
            action: res.action,
            autoMan: res.autoMan,
            raw: res.raw,
          };
        }
      } catch (err) {
        console.warn('[Modbus Poll Warning]', err.message);
      } finally {
        this.isPolling = false;
      }
    };

    // Immediate first poll, then every 1000ms (1 second sampling time)
    doPoll();
    this.pollTimer = setInterval(doPoll, 1000);
  }

  async writeRegister(slaveId, addr, rawVal) {
    if (!this.isConnected) {
      throw new Error('Not connected to COM port');
    }
    const res = await this.sendCommand(
      { cmd: 'write_reg', slaveId: slaveId || this.slaveId, addr, val: rawVal },
      1000
    );
    if (res.success) {
      return res;
    }
    throw new Error(res.error || 'Write failed');
  }

  async disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.isConnected && this.ps) {
      try {
        await this.sendCommand({ cmd: 'close' }, 800);
      } catch {
        // ignore
      }
    }
    this.isConnected = false;
    this.currentPort = '';
    this.latestData.connected = false;
    return { success: true };
  }
}

const bridgeInstance = new ModbusBridge();
module.exports = { bridgeInstance };
