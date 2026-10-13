import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { exec } from 'child_process'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { bridgeInstance } = require('./src/services/modbus/modbusServerBridge.cjs')

function serialPortPlugin(): Plugin {
  return {
    name: 'serial-port-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

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

        if (url === '/api/ports') {
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

        if (url === '/api/modbus/connect' && req.method === 'POST') {
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

        if (url === '/api/modbus/poll' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(bridgeInstance.latestData))
          return
        }

        if (url === '/api/modbus/write' && req.method === 'POST') {
          const body = await parseJsonBody()
          const slaveId = Number(body.slaveId) || bridgeInstance.slaveId || 1
          const reg = String(body.register || '').toLowerCase()
          const val = body.value

          let addr = 0
          let rawVal = 0

          // Address & Multiplier mapping per Modbus specification:
          // 1: PV 1000H (44097) - Read Only
          // 2: SP 1001H (44098) - multiply by 10
          // 3: Auto/Manual 1005H (44102)
          // 4: Action 1006H (44103)
          // 5: PB 1009H (44106) - multiply by 10
          // 6: Ti 100AH (44107)
          // 7: Td 100BH (44108)
          // 8: Bias 100CH (44109)
          // 9: OP 1012H (44115) - multiply by 10
          // 10: Auto Tuning 813H (42068)
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

        if (url === '/api/modbus/disconnect' && req.method === 'POST') {
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
})
