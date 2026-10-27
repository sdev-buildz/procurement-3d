import type { ApolloCache } from '@apollo/client'
import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { LocalState } from '@apollo/client/local-state'
import { sharedConfig } from '@packages/web-app-utils/shared'
import { setupRestartSubscription } from 'apollo-shared-ws'
import { stateSyncLink } from 'apollo-state-sync'
import { OperationTypeNode } from 'graphql'
import { createSharedClient } from 'graphql-shared-ws'
import { inMemoryStore } from '../util/inMemoryStore.ts'
import {
  connErrorTesterOperationName,
  errorTesterOperationName,
} from '../util/operationNames.ts'

const wssUrl = `wss://${sharedConfig.graphqlEndpoint.substring(sharedConfig.graphqlEndpoint.indexOf('://') + 3)}`

const httpLink = new HttpLink({
  uri: sharedConfig.graphqlEndpoint,
})

const sharedClient = createSharedClient({
  url: wssUrl,
})
const invalidSharedClient = createSharedClient({
  url: `wss://invalid-example.com/api/graphql`,
})

const sharedLinkForApi = new GraphQLWsLink(sharedClient)

const sharedLinkForConnErrors = new GraphQLWsLink(invalidSharedClient)

const innerSplitLink = ApolloLink.split(
  ({ operationType, operationName }) => {
    return Boolean(
      operationName?.toLowerCase().includes(connErrorTesterOperationName)
    )
  },
  sharedLinkForConnErrors as unknown as ApolloLink,
  sharedLinkForApi as unknown as ApolloLink
)
const splitLink = ApolloLink.split(
  (operation) => {
    return (
      operation.operationType === OperationTypeNode.SUBSCRIPTION ||
      operation.operationName
        ?.toLowerCase()
        .includes(errorTesterOperationName.toLowerCase()) ||
      operation.operationName === 'getMutableFields' ||
      operation.operationName === 'setMutableField'
    )
  },
  innerSplitLink,
  httpLink
)

/**
 * The Apollo Client instance for our graphql api endpoint.
 * @see Cache {@link inMemoryStore}
 */
const apolloClientOriginal = new ApolloClient({
  link: ApolloLink.from([stateSyncLink as unknown as ApolloLink, splitLink]),
  cache: inMemoryStore as unknown as ApolloCache,
  localState: new LocalState(),
})

/**
 * The Apollo Client instance with setup done for subscription restarts.
 */
export const apolloClient = setupRestartSubscription(
  apolloClientOriginal as unknown as Parameters<
    typeof setupRestartSubscription
  >[0],
  {
    sharedClientResolver: (operation) => {
      switch (operation.operationName) {
        case 'sub2':
          return sharedClient
        case 'sub1':
          return invalidSharedClient
        default:
          return
      }
    },
  }
)
