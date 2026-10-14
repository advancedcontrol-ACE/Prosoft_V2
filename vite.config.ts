import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { exec } from 'child_process'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { bridgeInstance } = require('./src/services/modbus/modbusServerBridge.cjs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { remoteLabManager } = require('./src/services/modbus/remoteLabManager.cjs')

function serialPortPlugin(): Plugin {
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
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              success: true,
              serverName: 'ACE Prosoft V2 Lab Host',
              hardwareConnected: bridgeInstance.isConnected,
              activePort: bridgeInstance.currentPort || 'None',
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
            res.end(
              JSON.stringify({
                ...authResult,
                hardwareConnected: bridgeInstance.isConnected,
                activePort: bridgeInstance.currentPort || 'None',
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
          exec('powershell -NoProfile -Command "[System.IO.Ports.SerialPort]::GetPortNames()"', (err, stdout) => {
            res.setHeader('Content-Type', 'application/json')
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
          try {
            const result = await bridgeInstance.connect(port, baud, slaveId)
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

          if (reg === 'sp' || body.addr === 0x1001) {
            addr = 0x1001
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'pb' || body.addr === 0x1009) {
            addr = 0x1009
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'it' || reg === 'ti' || body.addr === 0x100a) {
            addr = 0x100a
            rawVal = Math.round(Number(val))
          } else if (reg === 'dt' || reg === 'td' || body.addr === 0x100b) {
            addr = 0x100b
            rawVal = Math.round(Number(val))
          } else if (reg === 'bias' || body.addr === 0x100c) {
            addr = 0x100c
            rawVal = Math.round(Number(val))
          } else if (reg === 'op' || body.addr === 0x1012) {
            addr = 0x1012
            rawVal = Math.round(Number(val) * 10)
          } else if (reg === 'automan' || reg === 'auto' || body.addr === 0x1005) {
            addr = 0x1005
            rawVal = val === 'Manual' || val === 1 ? 1 : 0
          } else if (reg === 'action' || body.addr === 0x1006) {
            addr = 0x1006
            rawVal = val === 'Direct' || val === 1 ? 1 : 0
          } else if (reg === 'autotuning' || reg === 'at' || body.addr === 0x0813) {
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

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serialPortPlugin()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
  },
})
