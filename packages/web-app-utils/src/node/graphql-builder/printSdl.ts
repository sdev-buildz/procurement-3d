import {
  lexicographicSortSchema,
  printSchema,
  type GraphQLSchema,
} from 'graphql'
import { writeFileSync } from 'node:fs'

/**
 *  Generates and writes the schema.graphql file for the given schema.
 */
export function printGraphqlSdl(schema: GraphQLSchema, outputPath: string) {
  const schemaAsString = printSchema(lexicographicSortSchema(schema))
  writeFileSync(outputPath, schemaAsString)
}
