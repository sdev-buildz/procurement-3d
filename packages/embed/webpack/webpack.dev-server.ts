/**
 * @packageDocumentation
 * {@inheritdoc startWebpackServer}
 */

import { startWebpackServer } from '@packages/web-app-utils/node/webpack-start-server'
import { getEmbedWebpackConfig } from './webpack.config'

startWebpackServer(getEmbedWebpackConfig())
