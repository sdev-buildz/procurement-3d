import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { sharedConfig } from '@packages/web-app-utils/shared'
import { createClient } from 'graphql-ws'

const authLink = setContext((_, { headers }) => {
  const token =
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem('authToken')

  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

const graphqlUrl = sharedConfig.graphqlEndpoint
const websocketUrl = graphqlUrl.replace(/^http/, 'ws')
const websocketLink = new GraphQLWsLink(
  createClient({
    url: websocketUrl,
  })
)

const httpLink = new HttpLink({ uri: graphqlUrl })
const splitLink = ApolloLink.split(
  ({ operationType }) => operationType === 'subscription',
  websocketLink,
  httpLink
)

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, splitLink]),
  cache: new InMemoryCache(),
})
