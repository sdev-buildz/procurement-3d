/**
 * @packageDocumentation
 * {@inheritDoc getEmbedWebpackConfig}
 */

import { getWebpackConfig } from '@packages/web-app-utils/webpack-config'
import { sharedConfig } from '@packages/web-app-utils/shared'
import type webpack from 'webpack'

/**
 * Webpack configuration for the standalone 3D editor, hosted on a different
 * localhost port than the procurement web client.
 */
export const getEmbedWebpackConfig = (isDevServer = true) => {
  const config = getWebpackConfig(undefined, isDevServer)

  if (config.devServer) {
    config.devServer.port = sharedConfig.embedClientPort
    config.devServer.open = false
    config.devServer.headers = {
      'Content-Security-Policy': `frame-ancestors ${sharedConfig.webClientOrigin}`,
    }
  }

  return config
}

/** For knip */
export default getEmbedWebpackConfig() as webpack.Configuration
