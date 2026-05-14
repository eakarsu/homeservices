/**
 * Custom Next.js server with Socket.IO bootstrapped.
 *
 * Usage:
 *   npx tsx server.ts          (development)
 *   node server.js             (production, after tsc compile)
 *
 * Add to package.json scripts:
 *   "dev:socket": "tsx server.ts",
 *   "start:socket": "node server.js"
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initIO } from './src/lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Request handler error:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Bootstrap Socket.IO on the same HTTP server
  const io = initIO(httpServer)

  // Optional: log connected clients count every 30s in dev
  if (dev) {
    setInterval(async () => {
      const sockets = await io.fetchSockets()
      if (sockets.length > 0) {
        console.log(`[Socket.IO] ${sockets.length} client(s) connected`)
      }
    }, 30_000)
  }

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (Socket.IO enabled)`)
  })
})
