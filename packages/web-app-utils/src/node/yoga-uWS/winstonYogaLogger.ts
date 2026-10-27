import { logger } from '@packages/logger'
import type { YogaLogger } from 'graphql-yoga'

/**
 *  Winston Logger for Yoga server.
 */
export const winstonYogaLogger: YogaLogger = {
  debug: (...args) => logger.debug(args),
  error: (...args) => {
    if (
      args[0]?.path?.[0] === 'queryForError' ||
      args[0]?.path?.[0] === 'subscribeForError'
    )
      return
    logger.error(args)
  },
  info: (...args) => logger.info(args),
  warn: (...args) => logger.warn(args),
}
