import type { YogaServerInstance } from 'graphql-yoga'
import type { HttpRequest, HttpResponse, TemplatedApp } from 'uWebSockets.js'
import type { ListeningStatusType } from './types'

/**
 * @see {@link ListeningStatusType}
 */
export const listeningStatus: ListeningStatusType = {}

/**
 * @returns a new GraphQL API route handler
 */
export const getGraphqlApiHandler =
  <
    TServerContext extends Record<string, unknown>,
    TUserContext extends Record<string, unknown>,
  >(
    yoga: YogaServerInstance<TServerContext, TUserContext>
  ): Parameters<TemplatedApp['any']>[1] =>
  (res, req) => {
    if (!listeningStatus.acceptingNewConnections) {
      /**
       * Ignores the connection if the server is under graceful shutdown.
       */
      res.cork(() => {
        res.writeStatus('503 Service Unavailable')
        res.end(
          `Server stopped listening. Reason: ${listeningStatus.reasonForNotAccepting ?? 'Unknown'}`,
          true
        )
      })
      return
    }

    /** The value of the Authorization header in the incoming HTTP request */
    const authHeader = req.getHeader('authorization')
    const reqOrigin = req.getHeader('origin')
    /**
     * Storing the value of the Authorization header in the {@link HttpResponse | res} object.
     *  Because uWS erases the headers in the {@link HttpRequest | req} object when it
     *    encounters any await statements.
     *  GraphQL Yoga seems to 'await' before allowing us to set the currentUser object in context.
     *    We would need the value of the Authorization header when authenticating the user.
     *  @see Reference {@link https://github.com/uNetworking/uWebSockets.js/discussions/328#discussioncomment-173449}
     */
    res.authHeader = authHeader
    res.reqOrigin = reqOrigin
    /**
     * The GraphQL server is mounted on '/graphql'
     */
    yoga(res, req)
  }
