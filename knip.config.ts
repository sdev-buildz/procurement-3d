import type { KnipConfig } from 'knip'

// 1. Unwrap the configuration if it's a function or a promise-returning function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnwrapConfig<T> = T extends (...args: any[]) => infer R
  ? R extends Promise<infer P>
    ? P
    : R
  : T

type KnipConfigObject = UnwrapConfig<KnipConfig>

type KnipWorkspacesConfig = NonNullable<KnipConfigObject['workspaces']>

const webAppWorkspaceConfig: KnipWorkspacesConfig[string] = {
  webpack: {
    config: ['./webpack/webpack.config.ts'],
  },
}

const config: KnipConfig = {
  ignoreDependencies: ['@changesets/cli'],
  typedoc: {
    config: ['./typedoc.{config,dev}.js'],
  },
  workspaces: {
    'packages/web-app-utils': {
      entry: ['./src/node/graphql-builder/runCodegenCli.ts'],
      webpack: {
        config: ['./src/node/webpack.config.ts'],
      },
      'graphql-codegen': {
        config: ['./src/node/graphql-builder/codegenKnip.ts'],
      },
    },
    'packages/procurement': {
      ...webAppWorkspaceConfig,
      entry: ['./server/schema/prisma-objects.ts'],
    },
    'packages/db': {
      ignoreDependencies: [
        '@prisma/client',
        '@pothos/plugin-prisma',
        'prisma-pothos-types',
      ],
    },
  },
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
}

export default config
