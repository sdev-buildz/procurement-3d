/**
 * @packageDocumentation
 * {@inheritdoc webpackBundle}
 */
import { deployConfig } from '@deploy-config'
import { webpackBundle } from '@packages/web-app-utils/node/webpack-prod-bundler'

webpackBundle(deployConfig)
