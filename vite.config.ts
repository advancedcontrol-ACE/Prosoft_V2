import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { exec } from 'child_process'

function serialPortPlugin(): Plugin {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { bridgeInstance } = require('./src/services/modbus/modbusServerBridge.cjs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { remoteLabManager } = require('./src/services/modbus/remoteLabManager.cjs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tcpBridgeInstance } = require('./src/services/tcp/ace2007TcpBridge.cjs')

  return {
    name: 'serial-port-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '/'
        const parsedUrl = new URL(rawUrl, 'http://localhost')
        const pathname = parsedUrl.pathname
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1'
        const sessionToken = req.headers['x-session-token'] as string | undefined

        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-token')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Helper to parse JSON body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parseJsonBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', () => {
              try {
                resolve(JSON.parse(body || '{}'))
              } catch {
                resolve({})
              }
            })
          })
        }

        // ── Remote Lab Endpoints ──────────────────────────────────
        if (pathname === '/api/remote/host-info' && req.method === 'GET') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const os = require('os')
          const nets = os.networkInterfaces()
          let localIp = '127.0.0.1'
          for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
              if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
                localIp = net.address
                break
              }
            }
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: true,
              port: 5173,
              localIp,
              localUrl: `http://${localIp}:5173`,
              passkey: remoteLabManager.getPasskey(),
            })
          )
          return
        }

        if (pathname === '/api/remote/status' && req.method === 'GET') {
          const isHw = bridgeInstance.isConnected || tcpBridgeInstance.isConnected
          const activePort = bridgeInstance.currentPort || (tcpBridgeInstance.isConnected ? `${tcpBridgeInstance.host}:${tcpBridgeInstance.port} (TCP)` : 'None')
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: true,
              serverName: 'ACE Prosoft V2 Lab Host',
              hardwareConnected: isHw,
              activePort: activePort,
              passkeyRequired: true,
            })
          )
          return
        }

        if (pathname === '/api/remote/auth' && req.method === 'POST') {
          const body = await parseJsonBody()
          const authResult = remoteLabManager.authenticate(body.passkey, body.studentName, clientIp)
          res.setHeader('Content-Type', 'application/json')
          if (authResult.success) {
            const isHw = bridgeInstance.isConnected || tcpBridgeInstance.isConnected
            const activePort = bridgeInstance.currentPort || (tcpBridgeInstance.isConnected ? `${tcpBridgeInstance.host}:${tcpBridgeInstance.port} (TCP)` : 'None')
            res.end(
              JSON.stringify({
                ...authResult,
                hardwareConnected: isHw,
                activePort: activePort,
              })
            )
          } else {
            res.statusCode = 401
            res.end(JSON.stringify(authResult))
          }
          return
        }

        if (pathname === '/api/remote/sessions' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: true,
              passkey: remoteLabManager.getPasskey(),
              sessions: remoteLabManager.getActiveSessions(),
            })
          )
          return
        }

        if (pathname === '/api/remote/revoke' && req.method === 'POST') {
          const body = await parseJsonBody()
          const ok = remoteLabManager.revokeSession(body.token)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: ok }))
          return
        }

        if (pathname === '/api/remote/set-passkey' && req.method === 'POST') {
          const body = await parseJsonBody()
          const updated = remoteLabManager.setPasskey(body.passkey)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, passkey: updated }))
          return
        }

        if (pathname === '/api/remote/tunnel/start' && req.method === 'POST') {
          try {
            const result = await remoteLabManager.startTunnel(5173)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: String(err && (err as any).message ? (err as any).message : err) }))
          }
          return
        }

        if (pathname === '/api/remote/tunnel/stop' && req.method === 'POST') {
          const result = remoteLabManager.stopTunnel()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
          return
        }

        if (pathname === '/api/remote/tunnel/status' && req.method === 'GET') {
          const status = remoteLabManager.getTunnelStatus()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, ...status }))
          return
        }

        if (pathname === '/api/remote/tunnel/test' && req.method === 'POST') {
          const testResult = await remoteLabManager.testTunnel()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(testResult))
          return
        }

        // ── Serial & Modbus RTU Endpoints ─────────────────────────
        if (pathname === '/api/ports') {
          const psCmd = `powershell -NoProfile -Command "$valid = @(); foreach ($n in [System.IO.Ports.SerialPort]::GetPortNames()) { try { $sp = New-Object System.IO.Ports.SerialPort($n); $sp.Open(); $sp.Close(); $sp.Dispose(); $valid += $n } catch { $m = $_.Exception.Message; if ($m -match 'Access.*denied' -or ($_.Exception.InnerException -and $_.Exception.InnerException.Message -match 'Access.*denied')) { $valid += $n } } }; Write-Output ($valid -join [Environment]::NewLine)"`
          exec(psCmd, (err, stdout) => {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            res.setHeader('Pragma', 'no-cache')
            res.setHeader('Expires', '0')
            if (err || !stdout) {
              res.end(JSON.stringify([]))
              return
            }
            const ports = stdout
              .split(/[\r\n]+/)
              .map((s) => s.trim().toUpperCase())
              .filter((s) => /^COM\d+$/.test(s))
            const uniquePorts = Array.from(new Set(ports))
            res.end(JSON.stringify(uniquePorts))
          })
          return
        }

        if (pathname === '/api/modbus/connect' && req.method === 'POST') {
          const body = await parseJsonBody()
          const port = body.port || 'COM4'
          const baud = Number(body.baud) || 9600
          const slaveId = Number(body.slaveId) || 1
          const action = body.action || 'Direct'
          try {
            const result = await bridgeInstance.connect(port, baud, slaveId, action)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: String(err) }))
          }
          return
        }

        if (pathname === '/api/modbus/poll' && req.method === 'GET') {
          if (sessionToken) {
            const check = remoteLabManager.validateSession(sessionToken)
            if (!check.valid) {
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: check.error, revoked: true }))
              return
            }
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(bridgeInstance.latestData))
          return
        }

        if (pathname === '/api/modbus/write' && req.method === 'POST') {
          if (sessionToken) {
            const check = remoteLabManager.validateSession(sessionToken)
            if (!check.valid) {
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: check.error, revoked: true }))
              return
            }
          }

          const body = await parseJsonBody()
          const slaveId = Number(body.slaveId) || bridgeInstance.slaveId || 1
          const reg = String(body.register || '').toLowerCase()
          const val = body.value

          if (sessionToken) {
            remoteLabManager.validateSession(sessionToken, `Wrote ${reg.toUpperCase()}=${val}`)
          }

          let addr = 0
          let rawVal = 0

          if (reg === 'sp' || body.addr === 0x1001 || body.addr === 4097) {
            addr = 0x1001
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'pb' || reg === 'p' || body.addr === 0x1009 || body.addr === 4105) {
            addr = 0x1009
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'it' || reg === 'ti' || reg === 'i' || body.addr === 0x100a || body.addr === 4106) {
            addr = 0x100a
            rawVal = Math.round(Number(val))
          } else if (reg === 'dt' || reg === 'td' || reg === 'd' || body.addr === 0x100b || body.addr === 4107) {
            addr = 0x100b
            rawVal = Math.round(Number(val))
          } else if (reg === 'bias' || body.addr === 0x100c || body.addr === 4108) {
            addr = 0x100c
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'op' || body.addr === 0x1012 || body.addr === 4114) {
            addr = 0x1012
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'automan' || reg === 'auto' || reg === 'am' || reg === 'a/m' || body.addr === 0x1005 || body.addr === 4101) {
            addr = 0x1005
            // Writing 2 enables Manual mode, 0 enables Auto mode (Delta DTB: 0=PID/Auto, 2=Manual)
            if (typeof val === 'number') {
              rawVal = val
            } else if (val === 'Manual' || val === 'manual' || val === '2') {
              rawVal = 2
            } else if (val === 'Auto' || val === 'auto' || val === '0') {
              rawVal = 0
            } else {
              rawVal = Number(val) || 0
            }
          } else if (reg === 'action' || body.addr === 0x1006 || body.addr === 4102) {
            addr = 0x1006
            rawVal = val === 'Direct' || val === 1 ? 1 : 0
          } else if (reg === 'autotuning' || reg === 'at' || body.addr === 0x0813 || body.addr === 2067) {
            addr = 0x0813
            rawVal = Number(val) ? 1 : 0
          } else if (typeof body.addr === 'number') {
            addr = body.addr
            rawVal = Number(val)
          }

          if (addr === 0) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: 'Invalid register' }))
            return
          }

          try {
            const writeRes = await bridgeInstance.writeRegister(slaveId, addr, rawVal)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, addr, rawVal, writeRes }))
          } catch (err: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: String(err) }))
          }
          return
        }

        if (pathname === '/api/modbus/disconnect' && req.method === 'POST') {
          await bridgeInstance.disconnect()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, message: 'Disconnected' }))
          return
        }

        // ── ACE 2007 TCP DAQ Endpoints ──────────────────────────
        // /api/tcp/connect
        if (pathname === '/api/tcp/connect' && req.method === 'POST') {
          const body = await parseJsonBody()
          const host = body.host || '192.168.0.1'
          const port = Number(body.port) || 8080
          try {
            const result = await tcpBridgeInstance.connect(host, port)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: String(err) }))
          }
          return
        }

        // /api/tcp/poll
        if (pathname === '/api/tcp/poll' && req.method === 'GET') {
          if (sessionToken) {
            const check = remoteLabManager.validateSession(sessionToken)
            if (!check.valid) {
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: check.error, revoked: true }))
              return
            }
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(tcpBridgeInstance.latestData))
          return
        }

        // /api/tcp/write
        if (pathname === '/api/tcp/write' && req.method === 'POST') {
          if (sessionToken) {
            const check = remoteLabManager.validateSession(sessionToken)
            if (!check.valid) {
              res.statusCode = 401
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: check.error, revoked: true }))
              return
            }
          }
          const body = await parseJsonBody()
          const op0 = body.op !== undefined ? body.op : (body.op0 !== undefined ? body.op0 : 0)
          const op1 = body.op1 !== undefined ? body.op1 : 0
          if (sessionToken) {
            remoteLabManager.validateSession(sessionToken, `Wrote OP=${op0}`)
          }
          tcpBridgeInstance.sendOutput(op0, op1)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, op0: tcpBridgeInstance.op0, op1: tcpBridgeInstance.op1 }))
          return
        }

        // /api/tcp/disconnect
        if (pathname === '/api/tcp/disconnect' && req.method === 'POST') {
          const result = tcpBridgeInstance.disconnect()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
          return
        }

        // /api/tcp/wifi-ssid
        if (pathname === '/api/tcp/wifi-ssid' && req.method === 'GET') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { exec } = require('child_process')
          exec('netsh wlan show interfaces', (err: unknown, stdout: string) => {
            let ssid = ''
            if (!err && stdout) {
              const match = stdout.match(/^\s*SSID\s*:\s*(.+)$/m)
              if (match && match[1]) {
                ssid = match[1].trim()
              }
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                success: true,
                ssid: ssid || 'ACE2007-2',
                isAce: /^ACE/i.test(ssid),
                moduleName: /^ACE/i.test(ssid) ? ssid : (tcpBridgeInstance.moduleName || 'ACE2007-2'),
              })
            )
          })
          return
        }

        // ── Persistent App Settings Endpoints ─────────────────────
        if (pathname === '/api/settings') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const fs = require('fs')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const os = require('os')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const path = require('path')
          const settingsDir = path.join(os.homedir(), '.ace_prosoft')
          const settingsFile = path.join(settingsDir, 'settings.json')

          if (req.method === 'GET') {
            try {
              if (fs.existsSync(settingsFile)) {
                const content = fs.readFileSync(settingsFile, 'utf8')
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, settings: JSON.parse(content) }))
                return
              }
            } catch (err) {
              console.warn('[Vite API] Error reading settings:', err)
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, settings: null }))
            return
          }

          if (req.method === 'POST') {
            try {
              const body = await parseJsonBody()
              if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true })
              }
              let existing: Record<string, unknown> = {}
              if (fs.existsSync(settingsFile)) {
                try {
                  existing = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
                } catch {}
              }
              const merged = { ...existing, ...body }
              fs.writeFileSync(settingsFile, JSON.stringify(merged, null, 2), 'utf8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, settings: merged }))
              return
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: String(err) }))
              return
            }
          }
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    ...(command === 'serve' ? [serialPortPlugin()] : []),
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
  },
}))
