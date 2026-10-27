import type {
  HttpRequest,
  HttpResponse,
  RecognizedString,
  us_listen_socket,
} from 'uWebSockets.js'

/**
 *  Info on whether the server is accepting new connections, shutting down, etc...
 */
export type ListeningStatusType = {
  acceptingNewConnections?: boolean
  listenSocket?: us_listen_socket
  shuttingDown?: boolean
  reasonForNotAccepting?: RecognizedString
}

/**
 * The GraphQL context for HTTP requests.
 * Passed to GraphQL resolvers
 */
export type HttpContextType = {
  req: HttpRequest
  res: HttpResponse
}

/**
 * The GraphQL context for web socket requests.
 * Passed to GraphQL resolvers
 */
export type WsContextType = {
  connectionInitReceived: boolean
  acknowledged: boolean
  subscriptions: { '69ec209e-f8fc-4ca4-9411-04b77ca8a468': null }
  extra: {
    // socket: uWS.SSLWebSocket { persistedRequest: [Object] }
    // socket: WebSocket
    persistedRequest: {
      method: 'get'
      url: string
      query: unknown
      headers: Record<
        | 'host'
        | 'connection'
        | 'pragme'
        | 'upgrade'
        | 'origin'
        | 'accept-language'
        | 'sec-websocket-key'
        | 'sec-websocket-extensions'
        | 'sec-websocket-protocol',
        string
      >
    }
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
