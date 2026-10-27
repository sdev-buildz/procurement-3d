import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import {
  eslintJsConfig,
  eslintReactConfig,
  eslintTsConfig,
  extentionsPattern,
} from './eslint-ts-and-react.config'

export default defineConfig([
  {
    ignores: [
      '**/dist*',
      '**/generated',
      'packages/migration/tests/test-source-files',
      './docs',
      '**/contract.d.ts',
      './packages/db/migrations',
    ],
  },
  eslintJsConfig,
  eslintTsConfig,
  eslintReactConfig,
  /**
   * Nodejs global variables.
   */
  [
    {
      files: [`**/*.${extentionsPattern}`],
      ignores: ['website/web-client/**'],
      languageOptions: {
        globals: {
          ...globals.nodeBuiltin,
        },
      },
    },
  ],
  /**
   * To enforce rules on imports and dependencies.
   * @example To prevent client side code from importing server side code.
   */
  prettier,
])
