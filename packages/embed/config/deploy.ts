import { sharedConfig as defaultSharedConfig } from '@packages/web-app-utils/shared'
import path from 'path'

const apiServerOrigin = `https://localhost:443`

/**
 * {@link defaultSharedConfig | config } for the web-app.
 */
export const deployConfig = {
  ...defaultSharedConfig,
  origin: apiServerOrigin,
  graphqlEndpoint: `${apiServerOrigin}/api`,
  webClientBundlePath: path?.resolve?.(process.cwd(), './dist'),
} satisfies typeof defaultSharedConfig
