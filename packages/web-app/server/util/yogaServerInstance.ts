import {
  winstonYogaLogger,
  type GraphqlContextType,
} from '@packages/web-app-utils'
import { createYoga } from 'graphql-yoga'
import { schema } from '../schema'
import { initGraphqlContext } from './initGraphqlContext'

/**
 * The GraphQL server instance.
 */
export const yoga = createYoga<GraphqlContextType>({
  schema: schema,
  context: (context) => {
    return initGraphqlContext(context)
  },
  graphiql: {
    subscriptionsProtocol: 'WS',
  },
  logging: winstonYogaLogger,
})
