import type { BidLineItem } from '@packages/db/prisma-client'
import type { CuringTelemetry } from '@packages/mock-machines'
import { createPubSub } from 'graphql-yoga'

/**
 * The events that can be published or subscribed to
 */
export type PubsubEventsType = {
  bidApproval: [Pick<BidLineItem, 'id'>[]]
  curingTelemetry: [CuringTelemetry]
}

/**
 * The PubSub instance
 */
export const pubsub = createPubSub<PubsubEventsType>({})
