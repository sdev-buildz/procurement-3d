/**
 * {@inheritdoc getCodegenConfig}
 */
import type { CodegenConfig } from '@graphql-codegen/cli'

/**
 * For [knip](https://knip.dev/reference/plugins/graphql-codegen).
 */
export default {
  overwrite: true,
  schema: '',
  generates: {
    '': {
      plugins: ['typescript'],
    },
  },
} satisfies CodegenConfig
