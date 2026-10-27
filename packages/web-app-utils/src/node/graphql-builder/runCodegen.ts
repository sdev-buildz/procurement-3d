import type { CodegenConfig } from '@graphql-codegen/cli'
import { logger } from '@packages/logger'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

/**
 * Generates the .graphql schema file.
 */
export async function runCodegen(config: CodegenConfig) {
  const utilityPackagePath = path.resolve(import.meta.dirname, '../../..')
  const runnerPath = path.join(import.meta.dirname, 'runCodegenCli.ts')
  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      runnerPath,
      JSON.stringify({
        ...config,
        hooks: undefined,
      }),
    ],
    {
      cwd: utilityPackagePath,
      stdio: 'inherit',
    }
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `GraphQL Codegen process exited with status ${result.status ?? result.signal ?? 'unknown'}`
    )
  }

  logger.info('GraphQL types generated successfully!')
}

/**
 * @returns the generated codegen config
 */
export const getCodegenConfig = (
  targetFilePath: string,
  schema: NonNullable<CodegenConfig['schema']>
): CodegenConfig => {
  return {
    overwrite: true,
    schema,
    generates: {
      [`${targetFilePath}`]: {
        plugins: ['typescript'],
      },
    },
  }
}
