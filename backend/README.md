# LostLens Backend

Phase 2B: PostgreSQL + Prisma ORM 7 data modelling, layered on top of the
Phase 2A Express + TypeScript foundation.

This phase adds the database schema, Prisma client (Prisma 7, driver-adapter
based), seed data, and a DB health-check endpoint only — no auth, no item
APIs, no matching logic yet. Those arrive in later phases.

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM 7 (with the `@prisma/adapter-pg` driver adapter)
- dotenv, cors, helmet

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma   # Database schema (models, enums, relations)
│   └── seed.ts         # Development-only seed data
├── src/
│   ├── config/
│   │   ├── env.ts       # Environment variable loading
│   │   └── prisma.ts    # Shared PrismaClient instance (driver-adapter based)
│   ├── controllers/
│   │   ├── health.controller.ts       # GET /api/health
│   │   └── db-health.controller.ts    # GET /api/health/db
│   ├── generated/
│   │   └── prisma/      # Generated Prisma Client source (git-ignored,
│   │                    # created by `npm run prisma:generate`)
│   ├── middleware/    # (reserved for future middleware)
│   ├── routes/
│   │   └── health.routes.ts
│   ├── services/      # (reserved for future business logic)
│   ├── utils/          # (reserved for future helpers)
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
├── prisma.config.ts     # Prisma 7 config: schema/migrations path, seed
│                        # command, and DATABASE_URL (Prisma 7 no longer
│                        # reads the connection URL from schema.prisma)
└── tsconfig.json
```

## Prerequisites

- A running PostgreSQL instance (local or remote).
- Node.js and npm.

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your real PostgreSQL connection
string, e.g.:

```
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:5432/lostlens?schema=public"
```

Never commit your real `.env` file — it's already listed in `.gitignore`.
Only `.env.example` (with placeholders) is committed.

`DATABASE_URL` is read from `prisma.config.ts` (via `dotenv/config`), not
from `schema.prisma` — this is a Prisma 7 requirement, not optional.

## Generate the Prisma Client

Required after install and after any schema change. Prisma 7 generates
real TypeScript source (not a package inside `node_modules`) into
`src/generated/prisma`, using the `@prisma/adapter-pg` driver adapter to
actually connect to PostgreSQL at runtime:

```bash
npm run prisma:generate
```

`src/generated/prisma` is git-ignored — every environment (including CI)
must run this command itself rather than relying on a committed copy.

## Run Migrations

Creates/updates the database tables to match `prisma/schema.prisma`. Prisma
7 reads the schema path, migrations folder, and `DATABASE_URL` from
`prisma.config.ts`:

```bash
npm run prisma:migrate
```

This requires a reachable `DATABASE_URL`.

## Seed Development Data

Inserts a small set of fictional users, item reports, and one sample match.
The seed command itself is configured in `prisma.config.ts`
(`migrations.seed`), not in `package.json`:

```bash
npm run prisma:seed
```

Seeded users have a placeholder `passwordHash` value
(`DEV_PLACEHOLDER_NOT_A_REAL_HASH`) — this is **not** a real bcrypt hash and
cannot be used to log in. Real password hashing arrives with authentication
in a later phase.

## Prisma Studio

Browse and edit data with a local GUI. Prisma 7 reads the connection
details for Studio from `prisma.config.ts` automatically:

```bash
npm run prisma:studio
```

## Prisma 7 Notes

This project uses Prisma ORM 7, which changed several things from Prisma 6:

- The database connection URL now lives in `prisma.config.ts`, not in
  `schema.prisma`'s `datasource` block.
- `PrismaClient` requires a **driver adapter** — it can no longer connect to
  PostgreSQL on its own. `src/config/prisma.ts` and `prisma/seed.ts` both
  construct a `PrismaPg` adapter (from `@prisma/adapter-pg`, backed by the
  `pg` driver) and pass it in via `new PrismaClient({ adapter })`.
- The generator is `prisma-client` (not the older `prisma-client-js`), with
  an explicit `output` path (`src/generated/prisma`) and
  `moduleFormat = "cjs"` so the generated code matches this project's
  existing CommonJS setup (no changes to `tsconfig.json`'s `module` or to
  `package.json`'s module type were needed).
- Prisma no longer loads `.env` automatically — both `prisma.config.ts` and
  `prisma/seed.ts` start with `import 'dotenv/config'` for this reason.
- The seed command is configured via `migrations.seed` in
  `prisma.config.ts` (the old `package.json` `"prisma": { "seed": ... }`
  field has been removed).

## Development

Runs the server with auto-reload on file changes:

```bash
npm run dev
```

## Build

Compiles TypeScript to `dist/`:

```bash
npm run build
```

## Start (production)

Runs the compiled build:

```bash
npm start
```

## Type Checking

```bash
npm run typecheck
```

## Environment Variables

See `.env.example`:

- `PORT` — port the server listens on (defaults to `5000` if unset)
- `NODE_ENV` — environment name
- `CORS_ORIGIN` — allowed origin for CORS (your frontend's dev URL)
- `DATABASE_URL` — PostgreSQL connection string used by Prisma

## Health Endpoints

Once the server is running:

```
GET http://localhost:5000/api/health
```

```json
{
  "success": true,
  "message": "LostLens API is running"
}
```

```
GET http://localhost:5000/api/health/db
```

Tests actual database connectivity via a trivial query.

Success:

```json
{
  "success": true,
  "message": "Database connection is healthy"
}
```

Failure (HTTP 503, no internal details are leaked):

```json
{
  "success": false,
  "message": "Database connection is unavailable"
}
```

## Data Model Overview

- **User** — future authentication subject; has many item reports, claims,
  and notifications.
- **ItemReport** — a single LOST or FOUND report (one model for both).
- **Match** — a candidate pairing between one LOST and one FOUND report,
  with nullable similarity score fields for a future AI matching phase.
- **Claim** — an ownership-verification attempt against a Match.
- **Notification** — an in-app notification for a User.

No scoring, matching, claim-verification, or notification-delivery logic is
implemented in this phase — only the schema needed to support it later.
