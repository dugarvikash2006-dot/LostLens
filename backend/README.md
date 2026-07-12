# LostLens Backend

Phase 3B: Found Item Reporting, layered on top of Phase 3A Lost Item
Reporting, Phase 2C authentication, Phase 2B PostgreSQL + Prisma ORM 7,
and the Phase 2A Express + TypeScript foundation.

This phase adds `POST /api/items/found`, `GET /api/items/found/mine`, and
`GET /api/items/found/:id` — reusing the same `ItemReport` model as LOST
reports (`reportType: FOUND` instead of `LOST`). No image upload, AI
matching, claims, or notifications yet. Those arrive in later phases.

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM 7 (with the `@prisma/adapter-pg` driver adapter)
- bcrypt, jsonwebtoken, zod
- dotenv, cors, helmet

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma   # Database schema (models, enums, relations)
│   └── seed.ts         # Development-only seed data
├── src/
│   ├── config/
│   │   ├── env.ts       # Environment variable loading (incl. JWT config)
│   │   └── prisma.ts    # Shared PrismaClient instance (driver-adapter based)
│   ├── controllers/
│   │   ├── health.controller.ts       # GET /api/health
│   │   ├── db-health.controller.ts    # GET /api/health/db
│   │   ├── auth.controller.ts         # POST /signup, /login, GET /me
│   │   └── item.controller.ts         # LOST + FOUND report endpoints
│   ├── generated/
│   │   └── prisma/      # Generated Prisma Client source (git-ignored,
│   │                    # created by `npm run prisma:generate`)
│   ├── middleware/
│   │   ├── auth.middleware.ts      # requireAuth — verifies Bearer JWT
│   │   ├── validate.middleware.ts  # Zod request-body validation
│   │   └── error.middleware.ts     # Centralized error handler
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   └── item.routes.ts          # /lost, /mine, /found, /found/mine, /:id, /found/:id
│   ├── services/
│   │   ├── auth.service.ts   # signup/login/getCurrentUser business logic
│   │   └── item.service.ts   # shared create/list/get-by-id core, used by
│   │                          # both LOST and FOUND wrapper functions
│   ├── utils/
│   │   ├── app-error.ts   # Typed error with status code + safe message
│   │   ├── jwt.ts         # Sign/verify JWT (single source of truth)
│   │   └── password.ts    # bcrypt hash/compare
│   ├── validators/
│   │   ├── auth.validator.ts   # Zod schemas for signup/login
│   │   └── item.validator.ts   # Zod schemas for LOST + FOUND report creation
│   ├── types/
│   │   └── express.d.ts    # Adds req.user via declaration merging
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

Also set `JWT_SECRET` to a long, random value — the server refuses to
start without it (see Environment Variables below).

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
- `JWT_SECRET` — **required.** The app fails fast at startup with a clear
  error (`Missing required environment variable: JWT_SECRET`) if this is
  unset. Use a long, random value — never reuse the placeholder.
- `JWT_EXPIRES_IN` — token lifetime (e.g. `7d`, `1h`). Defaults to `7d` if
  unset.

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

## Authentication

Three endpoints, mounted under `/api/auth`. None of this is wired into the
frontend yet — that happens in a later phase.

### `POST /api/auth/signup`

Request body:

```json
{
  "fullName": "Example User",
  "email": "example@example.com",
  "password": "StrongPassword123"
}
```

Validation: `fullName` 2–80 chars (trimmed); `email` must be a valid
address (trimmed, lowercased); `password` 8–72 chars, must contain at
least one letter and one number.

Success — `201 Created`:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "...",
      "fullName": "Example User",
      "email": "example@example.com",
      "role": "USER",
      "createdAt": "..."
    },
    "token": "..."
  }
}
```

A duplicate email returns `409 Conflict`. Invalid input returns
`400 Bad Request` with a field-level error list. `passwordHash` is never
included in the response.

### `POST /api/auth/login`

Request body:

```json
{
  "email": "example@example.com",
  "password": "StrongPassword123"
}
```

Success — `200 OK`, same `user`/`token` shape as signup.

An unknown email and a wrong password both return the same
`401 Unauthorized` with the message `"Invalid email or password."` — the
API never reveals which one was wrong.

### `GET /api/auth/me`

Protected — requires the header:

```
Authorization: Bearer <token>
```

Success — `200 OK`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "...",
      "email": "...",
      "role": "USER",
      "createdAt": "..."
    }
  }
}
```

Missing header, malformed header (not `Bearer <token>`), invalid token, or
expired token all return `401 Unauthorized` with a safe generic message —
never the underlying JWT library error. If the token is valid but the
user has since been deleted, this also returns `401` rather than treating
it as a server error.

### Development Testing Sequence

With the server running (`npm run dev`) and a real database migrated:

```bash
# 1. Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Example User","email":"example@example.com","password":"StrongPassword123"}'

# 2. Log in (copy the returned token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"example@example.com","password":"StrongPassword123"}'

# 3. Call the protected endpoint
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token from step 2>"
```

### Note on Seeded Users

The Phase 2B seed script (`prisma/seed.ts`) gives its development users a
placeholder `passwordHash` value (`DEV_PLACEHOLDER_NOT_A_REAL_HASH`), which
is **not** a valid bcrypt hash. Those seeded users **cannot log in** through
`/api/auth/login` — this is intentional, not a bug. To get a real,
login-capable account, use `POST /api/auth/signup`.

## Lost Item Reporting

Three endpoints, mounted under `/api/items`. **All require
authentication** (`Authorization: Bearer <token>`) — every route in
`item.routes.ts` goes through `requireAuth` first. This phase only covers
LOST reports; there's no way to create a FOUND report yet.

The owner of a report is always taken from the verified token
(`req.user.id`) — never from anything in the request body.

### `POST /api/items/lost`

Request body:

```json
{
  "title": "Blue Water Bottle",
  "description": "Stainless steel bottle with a dented cap.",
  "category": "OTHER",
  "location": "Sports Complex",
  "dateLost": "2026-07-02"
}
```

`category` must be one of: `ELECTRONICS`, `ACCESSORIES`, `BAGS`,
`DOCUMENTS`, `KEYS`, `CLOTHING`, `BOOKS`, `OTHER`. `dateLost` accepts any
string `Date` can parse (an ISO date like `2026-07-02` is simplest).

Success — `201 Created`:

```json
{
  "success": true,
  "message": "Lost report created successfully",
  "data": {
    "report": {
      "id": "...",
      "userId": "...",
      "reportType": "LOST",
      "itemName": "Blue Water Bottle",
      "category": "OTHER",
      "description": "Stainless steel bottle with a dented cap.",
      "location": "Sports Complex",
      "eventDate": "2026-07-02T00:00:00.000Z",
      "status": "OPEN",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

(A few nullable fields the model shares with FOUND reports — `brand`,
`color`, `distinctiveFeatures`, `approximateTime`, `locationDetails`,
`imageUrl` — are also present, all `null` for now.)

Invalid input returns `400 Bad Request` with a field-level error list,
same shape as auth validation errors.

### `GET /api/items/mine`

Returns only the authenticated user's own LOST reports, newest first:

```json
{
  "success": true,
  "data": {
    "reports": [ /* same report shape as above */ ]
  }
}
```

### `GET /api/items/:id`

Returns a single LOST report — but only if the authenticated user owns it.

- Doesn't exist, or exists but is a FOUND report → `404 Not Found`
- Exists as LOST, but belongs to someone else → `403 Forbidden`
- Belongs to the caller → `200 OK` with `{ success: true, data: { report } }`

## Found Item Reporting

Mirrors Lost Item Reporting exactly, using the same `ItemReport` model
with `reportType: FOUND` instead of `LOST`. All three endpoints require
authentication the same way.

### `POST /api/items/found`

Request body — identical to the LOST version except `dateFound` instead
of `dateLost`:

```json
{
  "title": "Black Umbrella",
  "description": "Plain black umbrella found near the entrance.",
  "category": "OTHER",
  "location": "Main Entrance",
  "dateFound": "2026-07-09"
}
```

Success — `201 Created`, same report shape as LOST but with
`"reportType": "FOUND"` and `"message": "Found report created successfully"`.

Invalid input returns `400 Bad Request` with the same field-level error
shape (fields: `title`, `description`, `category`, `location`,
`dateFound`).

### `GET /api/items/found/mine`

Returns only the authenticated user's own FOUND reports, newest first —
same response shape as `GET /api/items/mine`.

### `GET /api/items/found/:id`

Returns a single FOUND report — same ownership rules as the LOST version
(404 if missing/wrong type, 403 if not the owner, 200 if it belongs to the
caller).

### Implementation note

`item.service.ts` has one internal `createReport`/`getMyReports`/
`getReportById` core (parameterized by `reportType`), with thin
LOST/FOUND-named functions on top of it — this is a refactor from Phase
3A's LOST-only version, done because the create/list/get-by-id logic was
identical apart from which `reportType` to filter/store by. The exported
function names and behavior for LOST are unchanged. `item.validator.ts`
similarly shares its title/description/category/location field
definitions between the LOST and FOUND Zod schemas.

## Data Model Overview

- **User** — supports authentication (Phase 2C: signup/login/JWT); has
  many item reports, claims, and notifications.
- **ItemReport** — a single LOST or FOUND report (one model for both).
  Phase 3A added LOST reports; Phase 3B added FOUND reports using the same
  model and the same API shape — no schema change was needed for either.
- **Match** — a candidate pairing between one LOST and one FOUND report,
  with nullable similarity score fields for a future AI matching phase.
- **Claim** — an ownership-verification attempt against a Match.
- **Notification** — an in-app notification for a User.

No schema changes were needed for Phase 3B — `reportType: FOUND` was
already a valid value of the existing `ReportType` enum, and every other
field is shared with LOST reports. No new migration was created.

Item update/delete, image upload, scoring, claim-verification, and
notification-delivery logic are still not implemented — only the schema
and the plain-CRUD slice of the LOST/FOUND API needed to support them
later.
