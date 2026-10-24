const net = require('net');

/**
 * ACE 2007 TCP DAQ Bridge
 *
 * Implements raw TCP socket communication for the ACE 2007 WiFi / Ethernet DAQ Module.
 * Refer to D:\ACE\Prosoft_V2\ACE2007.pdf:
 *
 * Output frame (to DAQ):
 *   1<OP0_3digit>2<OP1_3digit>.
 *   OP0 (0-100%) -> mapped to 0-255 -> 1000 + round(OP0 * 2.55) -> 1xxx
 *   OP1 (0-100%) -> mapped to 0-255 -> 2000 + round(OP1 * 2.55) -> 2xxx
 *   Terminator: '.'
 *   Example for OP0=50%: '11282000.'
 *
 * Input frame (from DAQ):
 *   1<4digit IP0>2<4digit IP1>3<4digit IP2>4<4digit IP3>...
 *   IP0..IP3: 0-4095 ADC counts mapped to 0.0 - 100.0 % (or 4-20 mA)
 *   Value 9999 indicates open circuit.
 */
class Ace2007TcpBridge {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.host = '192.168.0.1';
    this.port = 8080;
    this.op0 = 0.0; // 0 to 100%
    this.op1 = 0.0; // 0 to 100%
    this.ip0 = 0.0; // PV (0 to 100%)
    this.ip1 = 0.0;
    this.ip2 = 0.0;
    this.ip3 = 0.0;
    this.rawIp0 = 0;
    this.rawIp1 = 0;
    this.rawIp2 = 0;
    this.rawIp3 = 0;
    this.pollTimer = null;
    this.rxBuffer = '';
    this.latestData = {
      connected: false,
      timestamp: Date.now(),
      host: '192.168.0.1',
      port: 8080,
      pv: 0.0,
      sp: 50.0,
      pb: 20.0,
      it: 30,
      dt: 1,
      bias: 40.0,
      op: 0.0,
      op0: 0.0,
      op1: 0.0,
      ip0: 0.0,
      ip1: 0.0,
      ip2: 0.0,
      ip3: 0.0,
      action: 'Direct',
      autoMan: 'Auto',
      raw: {},
    };
  }

  connect(host = '192.168.0.1', port = 8080) {
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (_) {}
      this.socket = null;
    }
    this.host = (host || '192.168.0.1').trim();
    this.port = Number(port) || 8080;
    this.rxBuffer = '';

    return new Promise((resolve) => {
      let isSettled = false;
      const s = new net.Socket();
      s.setTimeout(6000);

      s.on('connect', () => {
        if (isSettled) return;
        isSettled = true;
        this.socket = s;
        this.isConnected = true;
        this.latestData.connected = true;
        this.latestData.host = this.host;
        this.latestData.port = this.port;
        this.startPolling(250);

        // Send initial frame immediately
        this.sendOutput(this.op0, this.op1);

        resolve({
          success: true,
          message: `Connected to ACE 2007 DAQ at ${this.host}:${this.port} (TCP)`,
          host: this.host,
          port: this.port,
        });
      });

      s.on('data', (chunk) => {
        this.handleData(chunk);
      });

      s.on('timeout', () => {
        if (!this.isConnected && !isSettled) {
          isSettled = true;
          s.destroy();
          resolve({
            success: false,
            error: `Connection timeout to ${this.host}:${this.port}`,
            message: `Connection timeout to ${this.host}:${this.port}. Check DAQ Wi-Fi / IP address.`,
          });
        }
      });

      s.on('error', (err) => {
        const errMsg = err && err.message ? err.message : String(err);
        if (!this.isConnected && !isSettled) {
          isSettled = true;
          resolve({
            success: false,
            error: errMsg,
            message: `Failed to connect to ${this.host}:${this.port}: ${errMsg}`,
          });
        } else {
          this.disconnect();
        }
      });

      s.on('close', () => {
        this.disconnect();
      });

      try {
        s.connect(this.port, this.host);
      } catch (e) {
        if (!isSettled) {
          isSettled = true;
          resolve({ success: false, error: String(e), message: String(e) });
        }
      }
    });
  }

  handleData(chunk) {
    this.rxBuffer += chunk.toString('ascii');

    // Parse Channel followed by 4 digits: 1(\d{4})2(\d{4})3(\d{4})4(\d{4})
    const match = this.rxBuffer.match(/1(\d{4})2(\d{4})3(\d{4})4(\d{4})/);
    if (match) {
      const raw0 = parseInt(match[1], 10);
      const raw1 = parseInt(match[2], 10);
      const raw2 = parseInt(match[3], 10);
      const raw3 = parseInt(match[4], 10);

      this.rawIp0 = raw0;
      this.rawIp1 = raw1;
      this.rawIp2 = raw2;
      this.rawIp3 = raw3;

      // 0-4095 ADC mapped to 0-100%
      // 9999 indicates open circuit
      this.ip0 = raw0 !== 9999 ? Number(((raw0 / 4095) * 100).toFixed(2)) : 0;
      this.ip1 = raw1 !== 9999 ? Number(((raw1 / 4095) * 100).toFixed(2)) : 0;
      this.ip2 = raw2 !== 9999 ? Number(((raw2 / 4095) * 100).toFixed(2)) : 0;
      this.ip3 = raw3 !== 9999 ? Number(((raw3 / 4095) * 100).toFixed(2)) : 0;

      this.latestData.pv = this.ip0;
      this.latestData.ip0 = this.ip0;
      this.latestData.ip1 = this.ip1;
      this.latestData.ip2 = this.ip2;
      this.latestData.ip3 = this.ip3;
      this.latestData.raw = { raw0, raw1, raw2, raw3 };
      this.latestData.timestamp = Date.now();

      // Advance buffer past match
      this.rxBuffer = this.rxBuffer.slice(match.index + match[0].length);
      if (this.rxBuffer.length > 512) {
        this.rxBuffer = '';
      }
    }
  }

  sendOutput(op0 = this.op0, op1 = this.op1) {
    if (!this.socket || !this.isConnected) return;
    this.op0 = Math.max(0, Math.min(100, Number(op0) || 0));
    this.op1 = Math.max(0, Math.min(100, Number(op1) || 0));
    this.latestData.op = this.op0;
    this.latestData.op0 = this.op0;
    this.latestData.op1 = this.op1;

    const val0 = Math.round(this.op0 * 2.55) + 1000;
    const val1 = Math.round(this.op1 * 2.55) + 2000;
    const frame = `${val0}${val1}.`;

    try {
      this.socket.write(frame, 'utf-8');
    } catch (_) {}
  }

  startPolling(intervalMs = 250) {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.sendOutput(this.op0, this.op1);
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  disconnect() {
    this.stopPolling();
    this.isConnected = false;
    this.latestData.connected = false;
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (_) {}
      this.socket = null;
    }
    return { success: true, message: 'Disconnected from ACE 2007 DAQ' };
  }
}

const tcpBridgeInstance = new Ace2007TcpBridge();
module.exports = { Ace2007TcpBridge, tcpBridgeInstance };
