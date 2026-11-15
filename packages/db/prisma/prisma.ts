import { sharedConfig } from '@packages/web-app-utils/shared'
import { PrismaPg } from '@prisma/adapter-pg'
import '../dotenv-configured'
import { PrismaClient } from '../generated/prisma-client'

/**
 * Create a new Prisma client.
 */
export const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString:
      sharedConfig.environment === 'PROD'
        ? process.env['DIRECT_URL']!
        : process.env['DATABASE_URL']!,
  })

  return new PrismaClient({ adapter })
}
