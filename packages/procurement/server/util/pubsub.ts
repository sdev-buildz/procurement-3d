import { createPubSub } from 'graphql-yoga'
import type { Product } from './types'

/**
 * The events that can be published or subscribed to
 */
export type PubsubEventsType = {
  productUpdates: [Product[]]
}

/**
 * The PubSub instance
 */
export const pubsub = createPubSub<PubsubEventsType>({})
