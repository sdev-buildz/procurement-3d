/**
 * @packageDocumentation
 * The Prisma Config file configures the Prisma CLI.
 * {@link https://www.prisma.io/docs/orm/reference/prisma-config-reference | Reference Doc https://www.prisma.io/docs/orm/reference/prisma-config-reference}
 */

import 'dotenv/config'
import path from 'node:path'
import type { PrismaConfig } from 'prisma'

export default {
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(import.meta.dirname, 'migrations'),
    seed: 'tsx --env-file=.env ./prisma/seed.ts',
  },
  datasource: {
    // url: env('DATABASE_URL'),
    url: process.env['DATABASE_URL']!,
  },
  views: {
    //path: path.join("db", "views"),
  },
  typedSql: {
    //path: path.join("db", "queries"),
  },
} satisfies PrismaConfig
