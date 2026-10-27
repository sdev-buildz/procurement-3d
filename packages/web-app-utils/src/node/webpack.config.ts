/**
 * @packageDocumentation
 *  {@inheritDoc getWebpackConfig}
 */
import CopyPlugin from 'copy-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import HtmlWebPackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import postCssPresetEnv from 'postcss-preset-env'
import webpack from 'webpack'
import { sharedConfig as defaultSharedConfig } from '../shared'
import babelConfig from './babel.config'

/**
 * Provides the webpack configuration object.
 */
export const getWebpackConfig = (
  sharedConfig = defaultSharedConfig,
  isDevServer = true
) => {
  const publicEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: String(sharedConfig.port),
    ORIGIN: sharedConfig.origin,
    WEB_CLIENT_ORIGIN: sharedConfig.webClientOrigin,
  }

  const config: webpack.Configuration = {
    ...(isDevServer
      ? {
          mode: 'development',
          devtool: 'eval-source-map',
          devServer: {
            static: {
              publicPath: sharedConfig.webClientBundlePath,
            },
            client: {
              progress: true,
            },
            server: 'https',
            hot: process.env.CI ? false : true,
            open: process.env.PLAYWRIGHT_TEST == '1' ? false : true,
            port: sharedConfig.webClientPort,
            historyApiFallback: true,
          },
        }
      : {
          mode: 'production',
        }),
    entry: {
      mainApp: './web-client/index.tsx',
    },
    output: {
      filename: (pathData) => {
        if (
          pathData.chunk?.name === 'serviceWorker' ||
          pathData.chunk?.name === 'sharedWorker'
        )
          return `static/[name].js`
        return `static/[name].[contenthash].js`
      },
      chunkFilename: 'static/[name].[contenthash].js',
      cssChunkFilename: 'static/[name].[contenthash].css',
      cssFilename: 'static/[name].[contenthash].css',
      path: sharedConfig.webClientBundlePath,
    },
    resolveLoader: {
      modules: [
        'node_modules',
        path.resolve(import.meta.dirname, '../../node_modules'),
      ],
    },
    module: {
      rules: [
        /**
         * Loading Typescript and JavaScript files
         */
        {
          test: /\.(ts|js)x?$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: [['babel-plugin-react-compiler'], {}],
                presets: babelConfig.presets,
              },
            },
          ],
        },
        /**
         * Loading CSS files
         */
        {
          test: /\.css$/,
          use: [
            isDevServer ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [postCssPresetEnv],
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      moduleIds: 'deterministic',
      // minimize: true,
      usedExports: 'global',
      splitChunks: {
        cacheGroups: {
          /**
           * Caching dependencies into separate chunk to
           * reduce rebuild times.
           * It also increases the FCP metric.
           */
          vendor: {
            test: /[\\/]node_modules[\\/](?!react-dom)/,
            name: 'vendors',
            chunks(chunk) {
              return (
                chunk.name !== 'serviceWorker' &&
                chunk.name !== 'sharedWorker' &&
                chunk.canBeInitial()
              )
            },
          },
          /**
           * Caching dependencies into separate chunk to
           * reduce rebuild times.
           * It also increases the FCP metric.
           */
          reactDom: {
            test: /[\\/]node_modules[\\/]react-dom[\\/]/,
            name: 'reactDom',
            chunks: 'initial',
          },
          /**
           * Caching lazy loaded modules into a separate chunk.
           * It includes the vendors which are imported only by lazy loaded modules.
           */
          asyncModule: {
            name: 'asyncModules',
            chunks: 'async',
          },
        },
      },
      ...(isDevServer ? {} : { minimizer: [new CssMinimizerPlugin(), '...'] }),
    },

    plugins: [
      new CopyPlugin({
        patterns: [{ from: 'public', to: 'static/assets' }],
      }),
      new HtmlWebPackPlugin({
        template: './public/index.html',
      }),

      /** Providing a safe subset of process.env as a global variable. */
      new webpack.DefinePlugin({
        process: {
          env: JSON.stringify(publicEnv),
        },
        'globalThis.__DEV__': true,
      }),
      ...(isDevServer ? [] : [new MiniCssExtractPlugin({})]),
    ],
    resolve: {
      fallback: {
        url: false,
        path: false,
      },
      extensions: ['.tsx', '.ts', '.json', '.jsx', '.js'],
      tsconfig: true,
    },
  }

  return config
}

// For knip.
export default getWebpackConfig()
