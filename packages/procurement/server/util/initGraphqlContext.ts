import {
  authenticate,
  type GraphqlContextType,
  isWsContext,
} from '@packages/web-app-utils'
import type { CustomGraphqlContextType } from '../schema/lib/builder'
import { pubsub } from './pubsub'
import { type User } from './types'

/**
 * To initialize the context object with our custom fields.
 * Used as a middleware, when the request packet is entering.
 */
export const initGraphqlContext = (
  context: GraphqlContextType
): CustomGraphqlContextType => {
  return {
    currentUser: authenticate(context) as User,
    reqOrigin: isWsContext(context)
      ? context.extra.persistedRequest.headers.origin
      : context.res.reqOrigin,
    pubsub: pubsub,
  }
}
