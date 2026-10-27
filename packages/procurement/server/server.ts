/**
 * Starts the server.
 * @packageDocumentation
 */
import { logger } from '@packages/logger'
import { listeningStatus, setupGracefulShutdown } from '@packages/web-app-utils'
import { config } from './config'
import { uWS } from './uWS'

uWS
  .any('/*', (res, req) => {
    res.writeStatus('200 OK').end()
  })
  .listen('localhost', config.port, (listenSocket) => {
    logger.info(`Visit https://localhost:${config.port}/api/graphql`)
    logger.info(`Visit https://localhost:${config.port}/`)

    listeningStatus.acceptingNewConnections = true
    listeningStatus.listenSocket = listenSocket

    setupGracefulShutdown(uWS, listeningStatus)
  })
