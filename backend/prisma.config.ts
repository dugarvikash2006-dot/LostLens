import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 moves the database URL, migrations path, and seed command out of
// schema.prisma and package.json and into this root-level config file.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
