import { prisma } from '@packages/db/prisma'
import type { User1 } from '@packages/db/prisma-client'
import {
  authenticate,
  type GraphqlContextType,
  isWsContext,
} from '@packages/web-app-utils'
import type { CustomGraphqlContextType } from '../schema/lib/builder'
import { pubsub } from './pubsub'

const isValidAuthPayload = (user: unknown): user is Pick<User1, 'id'> => {
  return (
    user !== undefined &&
    user !== null &&
    typeof user === 'object' &&
    'id' in user
  )
}

/**
 * To initialize the context object with our custom fields.
 * Used as a middleware, when the request packet is entering.
 */
export const initGraphqlContext = async (
  context: GraphqlContextType
): Promise<CustomGraphqlContextType> => {
  const payload = authenticate(context)
  let user: Pick<User1, 'id' | 'role'> | undefined | null
  if (isValidAuthPayload(payload)) {
    user = await prisma.user1.findFirst({
      select: {
        id: true,
        role: true,
      },
      where: {
        id: payload.id,
      },
    })
  }
  return {
    ...(user && user !== null
      ? { currentUser: user }
      : { currentUser: undefined }),
    reqOrigin: isWsContext(context)
      ? context.extra.persistedRequest.headers.origin
      : context.res.reqOrigin,
    pubsub: pubsub,
  }
}
