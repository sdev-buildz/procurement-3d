import { sharedConfig as defaultSharedConfig } from '@packages/web-app-utils/shared'
import path from 'path'

/**
 * {@link defaultSharedConfig | config } for the web-app.
 */
export const deployConfig = {
  ...defaultSharedConfig,
  webClientBundlePath: path?.resolve?.(process.cwd(), './dist'),
} satisfies typeof defaultSharedConfig
