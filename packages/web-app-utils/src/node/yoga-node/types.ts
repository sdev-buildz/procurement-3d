import type { IncomingMessage } from 'node:http'

/**
 *  Info on whether the server is accepting new connections, shutting down, etc...
 */
export type ListeningStatusType = {
  acceptingNewConnections?: boolean
  shuttingDown?: boolean
  reasonForNotAccepting?: string
}

/**
 * The GraphQL context for HTTP requests.
 * Passed to GraphQL resolvers
 */
export type HttpContextType = {
  request: Request
}

/**
 * The GraphQL context for web socket requests.
 * Passed to GraphQL resolvers
 */
export type WsContextType = {
  extra: {
    request: IncomingMessage
  }
  connectionParams?: {
    headers?: {
      authorization?: string
    }
  }
}

/**
 * The context object passed to the GraphQL resolvers
 */
export type GraphqlContextType = HttpContextType | WsContextType

/**
 * Type guard for {@link WsContextType}
 */
export const isWsContext = (
  context: GraphqlContextType
): context is WsContextType => {
  return ('extra' satisfies keyof WsContextType) in context
}
