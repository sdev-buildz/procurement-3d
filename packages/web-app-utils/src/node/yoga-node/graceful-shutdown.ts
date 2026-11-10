/**
 * @packageDocumentation
 * {@inheritDoc setupGracefulShutdown}
 */
import { logger } from '@packages/logger'
import type { Server } from 'node:http'
import type { ListeningStatusType } from './types'

/**
 * Tracks whether the HTTPS server is accepting requests or shutting down.
 */
export const listeningStatus: ListeningStatusType = {}

/**
 * Sets up the event listeners which initiate graceful shutdown.
 */
export function setupGracefulShutdown(
  server: Server,
  listeningStatus: ListeningStatusType
) {
  process.on('SIGTERM', () => initiateGracefulShutdown(server, listeningStatus))
  process.on('SIGINT', () => initiateGracefulShutdown(server, listeningStatus))
}

/**
 * Initiates graceful shutdown.
 *
 * It stops the app from accepting new connections.
 * But allows the already existing connections to remain and get served.
 *
 * Even if the terminal running this app gets control back,
 *  the nodejs app would still be running in the background, in case there are existing connections.
 * Once all the existing connections are served and closed, the app will automatically go out of scope
 *  and the memory will gracefully be deleted.
 */
function initiateGracefulShutdown(
  server: Server,
  listeningStatus: ListeningStatusType
) {
  logger.info('Initiating graceful shutdown...')

  if (listeningStatus.shuttingDown) {
    return
  }

  listeningStatus.acceptingNewConnections = false
  listeningStatus.shuttingDown = true
  listeningStatus.reasonForNotAccepting =
    'The server is under graceful shutdown.'

  server.close((error) => {
    if (error) {
      logger.error(`Error during graceful shutdown: ${error.message}`)
      process.exitCode = 1
      return
    }

    logger.info('Server shut down after serving existing connections.')
  })
}
