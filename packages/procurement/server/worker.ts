import { sharedConfig } from '@packages/web-app-utils/shared'
import { createYoga } from 'graphql-yoga'
import type { execute, ExecutionArgs, subscribe } from 'graphql'
import {
  handleProtocols,
  makeServer,
  type ConnectionInitMessage,
} from 'graphql-ws'
import { schema } from './schema'
import { initGraphqlContext } from './util/initGraphqlContext'

type EnvelopedExecutionArgs = ExecutionArgs & {
  rootValue: {
    execute: typeof execute
    subscribe: typeof subscribe
  }
}

type CloudflareWebSocket = WebSocket & {
  accept(): void
}

type CloudflareWebSocketPair = {
  0: WebSocket
  1: CloudflareWebSocket
}

const webSocketPairConstructor = (
  globalThis as typeof globalThis & {
    WebSocketPair: new () => CloudflareWebSocketPair
  }
).WebSocketPair

const yoga = createYoga({
  graphqlEndpoint: '/api/graphql',
  schema,
  context: (context) => initGraphqlContext(context),
  cors: {
    origin: [
      sharedConfig.origin,
      sharedConfig.webClientOrigin,
      sharedConfig.embedClientOrigin,
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  graphiql: {
    subscriptionsProtocol: 'WS',
  },
})

const graphqlWsServer = makeServer<
  ConnectionInitMessage['payload'],
  { request: Request }
>({
  execute: (args) => (args as EnvelopedExecutionArgs).rootValue.execute(args),
  subscribe: (args) =>
    (args as EnvelopedExecutionArgs).rootValue.subscribe(args),
  onSubscribe: async (ctx, _id, params) => {
    const { schema, execute, subscribe, contextFactory, parse, validate } =
      yoga.getEnveloped({ request: ctx.extra.request })
    const args: EnvelopedExecutionArgs = {
      schema,
      operationName: params.operationName,
      document: parse(params.query),
      variableValues: params.variables,
      contextValue: await contextFactory(),
      rootValue: {
        execute,
        subscribe,
      },
    }

    const errors = validate(args.schema, args.document)
    return errors.length ? errors : args
  },
})

const handleWebSocket = (request: Request): Response => {
  const protocol = handleProtocols(
    request.headers.get('sec-websocket-protocol') ?? ''
  )
  if (!protocol) {
    return new Response('Unsupported WebSocket protocol', {
      status: 426,
      headers: { 'Sec-WebSocket-Protocol': 'graphql-transport-ws' },
    })
  }

  const pair = new webSocketPairConstructor()
  const client = pair[0]
  const server = pair[1]
  server.accept()

  const dispose = graphqlWsServer.opened(
    {
      protocol,
      send: (data) => server.send(data),
      close: (code, reason) => server.close(code, reason),
      onMessage: (callback) => {
        server.addEventListener('message', (event) => {
          if (typeof event.data !== 'string') {
            server.close(4400, 'Expected a text message')
            return
          }

          void callback(event.data).catch((error: unknown) => {
            console.error('GraphQL WebSocket message failed', error)
            server.close(1011, 'Internal server error')
          })
        })
      },
    },
    { request }
  )

  let disposed = false
  const cleanup = (code?: number, reason?: string): void => {
    if (disposed) return
    disposed = true
    void dispose(code, reason)
  }
  server.addEventListener('close', (event) => {
    cleanup(event.code, event.reason)
  })
  server.addEventListener('error', () => {
    cleanup(1011, 'WebSocket error')
  })

  return new Response(null, {
    status: 101,
    headers: { 'Sec-WebSocket-Protocol': protocol },
    webSocket: client,
  } as ResponseInit & { webSocket: WebSocket })
}

/**
 * Handles GraphQL HTTP and WebSocket requests.
 */
function fetchWorker(request: Request): Promise<Response> | Response {
  const { pathname } = new URL(request.url)
  if (pathname !== '/api/graphql') {
    return new Response('Not Found', { status: 404 })
  }

  if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return handleWebSocket(request)
  }

  return yoga.fetch(request)
}

export default {
  fetch: fetchWorker,
}
