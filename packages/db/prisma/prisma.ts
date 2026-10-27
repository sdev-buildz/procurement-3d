import { PrismaPg } from '@prisma/adapter-pg'
import '../dotenv-configured'
import { PrismaClient } from '../generated/prisma-client'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

export { prisma }
