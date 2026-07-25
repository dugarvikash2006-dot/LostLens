import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export async function getDbHealth(_req: Request, res: Response) {
  try {
    // A trivial round-trip query is enough to confirm the connection
    // (and credentials, and that the database is reachable) are valid.
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
    })
  } catch (error) {
    // Log the real error server-side for debugging, but never leak
    // connection strings, credentials, or raw driver errors to the client.
    console.error('Database health check failed:', error)

    res.status(503).json({
      success: false,
      message: 'Database connection is unavailable',
    })
  }
}
