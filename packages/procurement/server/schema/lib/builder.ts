import type PrismaTypes from '@packages/db/pothos-prisma-types'
import { getDatamodel } from '@packages/db/pothos-prisma-types'
import { prisma } from '@packages/db/prisma'
import { sharedConfig } from '@packages/web-app-utils'
import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import type { pubsub } from '../../util/pubsub'
import type { User } from '../../util/types'

/**
 *  The custom objects added to the context.
 */
export type CustomGraphqlContextType = {
  currentUser: User | undefined
  reqOrigin: string
  pubsub: typeof pubsub
}

/**
 * The custom types added to the pothos schema.
 */
export type CustomSchemaTypes = {
  Scalars: {
    DateTime: {
      Input: Date
      Output: Date
    }
  }
  PrismaTypes: PrismaTypes
  Context: CustomGraphqlContextType
}

/**
 * The Pothos GraphQL schema builder instance.
 */
export const builder = new SchemaBuilder<CustomSchemaTypes>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    // This give pothos information about your tables, relations, and indexes to help it generate optimal queries at runtime.
    // This used to be attached to the prisma client, but has been removed in most runtimes/modes to reduce bundle size.
    dmmf: getDatamodel(),

    // Tp use /// comments from prisma schema as descriptions
    exposeDescriptions: true,

    // use where clause from prismaRelatedConnection for totalCount (defaults to true)
    filterConnectionTotalCount: true,

    // warn when not using a query parameter correctly
    onUnusedQuery: sharedConfig.environment === 'PROD' ? null : 'warn',
  },
})

builder.queryType({
  description: 'The schema root for fetching data.',
})

builder.mutationType({
  description: `The schema root for mutating data`,
})

builder.subscriptionType({
  description: `The schema root for subscriptions`,
})
