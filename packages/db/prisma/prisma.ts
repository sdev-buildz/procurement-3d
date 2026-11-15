import { sharedConfig } from '@packages/web-app-utils/shared'
import { PrismaPg } from '@prisma/adapter-pg'
import '../dotenv-configured'
import { PrismaClient } from '../generated/prisma-client'

// const adapter = new PrismaPg({ connectionString: process.env['DIRECT_URL']! })
const adapter = new PrismaPg({
  connectionString:
    sharedConfig.environment === 'PROD'
      ? process.env['DIRECT_URL']!
      : process.env['DATABASE_URL']!,
  // process.env['DATABASE_URL']!
})
const prisma = new PrismaClient({ adapter })

export { prisma }
