import type { BidLineItem } from '@packages/db/prisma-client'
import { createPubSub } from 'graphql-yoga'
import type { Product } from './types'

/**
 * The events that can be published or subscribed to
 */
export type PubsubEventsType = {
  productUpdates: [Product[]]
  bidApproval: [Pick<BidLineItem, 'id'>[]]
}

/**
 * The PubSub instance
 */
export const pubsub = createPubSub<PubsubEventsType>({})
