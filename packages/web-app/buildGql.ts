import { buildGraphQL, getCodegenConfig } from '@packages/web-app-utils'
import { sharedConfig } from '@packages/web-app-utils/shared'
import path from 'node:path'
import { schema } from './server/schema'

const tsEmitFilePath = `${import.meta.dirname}/generated/typescript-react-apollo.tsx`
const schemaFilePath = path.join(
  import.meta.dirname,
  sharedConfig.graphqlSdlPath
)

const codegenConfig = {
  ...getCodegenConfig(tsEmitFilePath, schemaFilePath),
  documents: path.join(import.meta.dirname, 'web-client/**/*.{ts,tsx}'),
}
buildGraphQL(schema, schemaFilePath, codegenConfig)
