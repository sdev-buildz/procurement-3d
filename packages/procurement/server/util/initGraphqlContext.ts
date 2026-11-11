import { prisma } from '@packages/db/prisma'
import type { User1 } from '@packages/db/prisma-client'
import { authenticate } from '@packages/web-app-utils/node/yoga-node/authenticate'
import {
  isWsContext,
  type GraphqlContextType,
} from '@packages/web-app-utils/node/yoga-node/types'
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
  let user: Pick<User1, 'id' | 'email' | 'role'> | undefined | null
  if (isValidAuthPayload(payload)) {
    user = await prisma.user1.findFirst({
      select: {
        id: true,
        email: true,
        role: true,
      },
      where: {
        id: Number(payload.id),
      },
    })
  }
  return {
    ...(user && user !== null
      ? { currentUser: user }
      : { currentUser: undefined }),
    reqOrigin: isWsContext(context)
      ? getHeaderValue(context.extra.request.headers.origin)
      : (context.request.headers.get('origin') ?? ''),
    pubsub: pubsub,
  }
}

const getHeaderValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
