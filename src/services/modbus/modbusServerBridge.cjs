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
    this.commandChain = Promise.resolve();
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
              const { resolver, timer } = this.responseQueue.shift();
              clearTimeout(timer);
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

  sendCommand(cmdObj, timeoutMs = 2500) {
    const run = () =>
      new Promise((resolve, reject) => {
        if (!this.ps || !this.daemonReady) {
          return reject(new Error('Daemon not ready'));
        }

        const timer = setTimeout(() => {
          const idx = this.responseQueue.findIndex((item) => item.timer === timer);
          if (idx !== -1) {
            this.responseQueue.splice(idx, 1);
          }
          reject(new Error(`Modbus daemon response timeout for ${cmdObj.cmd}`));
        }, timeoutMs);

        this.responseQueue.push({ resolver: resolve, timer });
        this.ps.stdin.write(JSON.stringify(cmdObj) + '\n');
      });

    const chain = this.commandChain.then(run, run);
    this.commandChain = chain.catch(() => {});
    return chain;
  }

  async connect(portName = 'COM4', baud = 9600, slaveId = 1, action = 'Direct') {
    await this.startDaemon();
    this.slaveId = slaveId || 1;
    const res = await this.sendCommand({ cmd: 'open', port: portName, baud, slaveId: this.slaveId });
    if (res.status === 'opened') {
      this.isConnected = true;
      this.currentPort = portName;

      // Action register handshake: write Action value (1 for Direct, 0 for Reverse) to Action address 4102 (1006H)
      const actionRaw = (action === 'Direct' || action === 1 || action === '1') ? 1 : 0;
      try {
        const writeRes = await this.sendCommand(
          { cmd: 'write_reg', slaveId: this.slaveId, addr: 0x1006, val: actionRaw },
          2500
        );
        if (!writeRes || !writeRes.success) {
          throw new Error(writeRes?.error || 'No response to Action register (4102) handshake');
        }
      } catch (handshakeErr) {
        // Handshake failed! Disconnect and release the serial port
        await this.disconnect();
        throw new Error(`Controller did not respond to Action register (4102) handshake on ${portName}. (${handshakeErr.message})`);
      }

      this.latestData.connected = true;
      this.latestData.action = actionRaw === 1 ? 'Direct' : 'Reverse';

      // Start 1-second continuous poll loop
      this.startPollingLoop();

      return {
        success: true,
        portName,
        message: `Connected to ${portName}. Action register (4102) handshake verified.`,
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
        const res = await this.sendCommand({ cmd: 'poll_all', slaveId: this.slaveId }, 2500);
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
      2500
    );
    if (res.success) {
      // Immediately reflect written value in cache
      if (addr === 0x1001) this.latestData.sp = rawVal / 10.0;
      else if (addr === 0x1005) this.latestData.autoMan = rawVal === 2 ? 'Manual' : 'Auto';
      else if (addr === 0x1006) this.latestData.action = rawVal === 1 ? 'Direct' : 'Reverse';
      else if (addr === 0x1009) this.latestData.pb = rawVal / 10.0;
      else if (addr === 0x100a) this.latestData.it = rawVal;
      else if (addr === 0x100b) this.latestData.dt = rawVal;
      else if (addr === 0x100c) this.latestData.bias = rawVal / 10.0;
      else if (addr === 0x1012) this.latestData.op = rawVal / 10.0;
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
