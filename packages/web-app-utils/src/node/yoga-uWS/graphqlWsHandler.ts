import type { execute, subscribe } from 'graphql'
import { type ExecutionArgs } from 'graphql'
import { makeBehavior } from 'graphql-ws/use/uWebSockets'
import type { YogaServerInstance } from 'graphql-yoga'

type EnvelopedExecutionArgs = ExecutionArgs & {
  rootValue: {
    execute: typeof execute
    subscribe: typeof subscribe
  }
}

/**
 * @returns a new GraphQL WS API route handler
 */
export const getGraphqlWsHandler = <
  TServerContext extends Record<string, unknown>,
  TUserContext extends Record<string, unknown>,
>(
  yoga: YogaServerInstance<TServerContext, TUserContext>
) =>
  makeBehavior({
    execute: (args) => {
      return (args as EnvelopedExecutionArgs).rootValue.execute(args)
    },

    subscribe: (args) => {
      return (args as EnvelopedExecutionArgs).rootValue.subscribe(args)
    },
    onSubscribe: async (ctx, _id, params) => {
      const { schema, execute, subscribe, contextFactory, parse, validate } =
        yoga.getEnveloped(ctx)

      const args: EnvelopedExecutionArgs = {
        schema,
        operationName: params.operationName,
        document: parse(params.query),
        variableValues: params.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe,
        },
      }

      const errors = validate(args.schema, args.document)
      if (errors.length) return errors
      return args
    },
  })
