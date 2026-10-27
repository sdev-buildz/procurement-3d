import type { CodegenConfig } from '@graphql-codegen/cli'
import type { GraphQLSchema } from 'graphql'
import { printGraphqlSdl } from './printSdl'
import { runCodegen } from './runCodegen'

/**
 * Generates .graphql sdl file and emits Typescript types.
 */
export const buildGraphQL = async (
  schema: GraphQLSchema,
  outputPath: string,
  codegenConfig: CodegenConfig
) => {
  printGraphqlSdl(schema, outputPath)
  await runCodegen(codegenConfig)
}
