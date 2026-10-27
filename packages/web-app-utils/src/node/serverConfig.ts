/**
 * {@inheritDoc config}
 * @see serverConfig
 */

import { logger } from '@packages/logger'
import { sharedConfig } from '../shared'

/**
 * The server's configuration object.
 * It abstracts the environment variables.
 */
export const serverConfig = {
  sampleEnv: process.env.SAMPLE_ENV,
  ...sharedConfig,

  auth: {
    /**
     * Used in authorization header. The key must be 32 bytes (256 bits) for AES-256
     */
    jweKey:
      process.env.JWE_KEY ??
      (sharedConfig.environment === 'DEV' ? '1'.repeat(32) : ''),
  },
}

if (!serverConfig.auth.jweKey) {
  logger.error(
    `No JWE Key present. Provide a JWE_KEY environment variable and keep it secure from others.`,
    {
      readMoreAboutJwe: `https://datatracker.ietf.org/doc/html/rfc7516`,
    }
  )
  process.emit('SIGTERM')
}
