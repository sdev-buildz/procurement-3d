/**
 * {@inheritdoc getCodegenConfig}
 */
import type { CodegenConfig } from '@graphql-codegen/cli'
import { getCodegenConfig } from './runCodegen'

/**
 * For [knip](https://knip.dev/reference/plugins/graphql-codegen).
 */
export default getCodegenConfig('', '') as CodegenConfig
