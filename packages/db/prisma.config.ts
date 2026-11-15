/**
 * @packageDocumentation
 * The Prisma Config file configures the Prisma CLI.
 * {@link https://www.prisma.io/docs/orm/reference/prisma-config-reference | Reference Doc https://www.prisma.io/docs/orm/reference/prisma-config-reference}
 */

import { sharedConfig } from '@packages/web-app-utils/shared'
import 'dotenv/config'
import path from 'node:path'
import type { PrismaConfig } from 'prisma'
console.log(
  'conn string = ',
  process.env.CI === 'true' ? 'DIRECT_URL' : 'DATABASE_URL'
)
export default {
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(import.meta.dirname, 'migrations'),
    seed: 'tsx --env-file-if-exists=.env ./prisma/seed.ts',
  },
  datasource: {
    // url: env('DATABASE_URL'),
    url:
      sharedConfig.environment === 'PROD'
        ? process.env['DIRECT_URL']!
        : process.env['DATABASE_URL']!,
  },
  views: {
    //path: path.join("db", "views"),
  },
  typedSql: {
    //path: path.join("db", "queries"),
  },
} satisfies PrismaConfig
