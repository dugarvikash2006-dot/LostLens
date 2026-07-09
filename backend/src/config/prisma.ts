import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Reuse a single PrismaClient instance across the app instead of creating
// one per request/controller. In dev mode with ts-node/nodemon restarts,
// this also avoids exhausting the database connection pool by stashing the
// client on the Node global object.

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.')
  }

  // Prisma 7 has no built-in connection engine — a driver adapter is
  // required to actually talk to PostgreSQL.
  const adapter = new PrismaPg({ connectionString })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
