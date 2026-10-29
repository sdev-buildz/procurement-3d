/**
 * @packageDocumentation
 * {@inheritdoc startWebpackServer}
 */

import { startWebpackServer } from '@packages/web-app-utils'
import { getEmbedWebpackConfig } from './webpack.config'

startWebpackServer(getEmbedWebpackConfig())
