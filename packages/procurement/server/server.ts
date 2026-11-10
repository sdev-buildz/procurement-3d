/**
 * Starts the server.
 * @packageDocumentation
 */
import { logger } from '@packages/logger'
import {
  getGraphqlWsHandler,
  listeningStatus,
  setupGracefulShutdown,
} from '@packages/web-app-utils'
import { useServer } from 'graphql-ws/use/ws'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import path from 'node:path'
import { useSofa } from 'sofa-api'
import { WebSocketServer } from 'ws'
import { config } from './config'
import { schema } from './schema'
import { yoga } from './util/yogaServerInstance'

const server = createServer(
  {
    cert: readFileSync(path.join(import.meta.dirname, './cert/cert.pem')),
    key: readFileSync(path.join(import.meta.dirname, './cert/cert.key')),
  },
  (request, response) => {
    if (!listeningStatus.acceptingNewConnections) {
      response.writeHead(503, 'Service Unavailable')
      response.end(
        `Server stopped listening. Reason: ${listeningStatus.reasonForNotAccepting ?? 'Unknown'}`
      )
      return
    }

    if (request.url?.startsWith('/api/')) {
      yoga(request, response)
      return
    }

    if (request.url?.startsWith('/rest/')) {
      sofa(request, response)
      return
    }

    response.writeHead(200)
    response.end()
  }
)

const sofa = useSofa({
  basePath: '/rest',
  schema,
  swaggerUI: {
    endpoint: '/swagger',
  },
})

const wsServer = new WebSocketServer({ noServer: true })
useServer(getGraphqlWsHandler(yoga), wsServer)

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url ?? '/', 'https://localhost').pathname
  if (pathname !== '/api/graphql' || !listeningStatus.acceptingNewConnections) {
    socket.destroy()
    return
  }

  wsServer.handleUpgrade(request, socket, head, (webSocket) => {
    wsServer.emit('connection', webSocket, request)
  })
})

server.listen(config.port, process.env.HOST ?? 'localhost', () => {
  logger.info(`Visit https://localhost:${config.port}/api/graphql`)
  logger.info(`Visit https://localhost:${config.port}/`)

  listeningStatus.acceptingNewConnections = true
  setupGracefulShutdown(server, listeningStatus)
})
