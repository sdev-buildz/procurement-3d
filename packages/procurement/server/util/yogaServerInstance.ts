import {
  winstonYogaLogger,
  type GraphqlContextType,
} from '@packages/web-app-utils'
import { sharedConfig } from '@packages/web-app-utils/shared'
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
  cors: {
    origin: [
      sharedConfig.origin,
      sharedConfig.webClientOrigin,
      sharedConfig.embedClientOrigin,
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  graphiql: {
    subscriptionsProtocol: 'WS',
  },
  logging: winstonYogaLogger,
})
