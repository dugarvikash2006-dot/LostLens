# LostLens Backend

Express + TypeScript backend for LostLens, an intelligent lost-and-found
platform. Covers the foundation, authentication, database, lost/found
item reporting with Cloudinary image uploads, and (this milestone) wiring
to a standalone AI embedding service.

## Tech Stack

- Node.js, Express, TypeScript
- PostgreSQL via Prisma ORM 7 (with the `@prisma/adapter-pg` driver adapter)
- bcrypt, jsonwebtoken, zod
- multer (multipart parsing), cloudinary (image hosting)
- dotenv, cors, helmet
- Native `fetch` (Node 18+) for calling the standalone AI service — no
  extra HTTP client dependency needed

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   ├── env.ts         # Environment variable loading (incl. JWT, Cloudinary, AI service config)
│   │   ├── prisma.ts      # Shared PrismaClient instance (driver-adapter based)
│   │   └── cloudinary.ts  # Cloudinary SDK configuration
│   ├── controllers/
│   │   ├── health.controller.ts
│   │   ├── db-health.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── item.controller.ts       # LOST + FOUND report endpoints (unchanged this milestone)
│   │   └── upload.controller.ts     # POST /items/upload (unchanged this milestone)
│   ├── generated/
│   │   └── prisma/      # Generated Prisma Client source (git-ignored)
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   └── item.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── item.service.ts     # Report creation logic — untouched this milestone
│   │   ├── upload.service.ts   # Cloudinary upload + (new) AI embedding trigger
│   │   └── ai.service.ts       # NEW — small client for the standalone AI service
│   ├── utils/
│   ├── validators/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## Setup

```bash
npm install
cp .env.example .env   # fill in real values
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Environment Variables

See `.env.example`:

- `PORT`, `NODE_ENV`, `CORS_ORIGIN` — server basics
- `DATABASE_URL` — PostgreSQL connection string (read by `prisma.config.ts`, not `schema.prisma` — a Prisma 7 requirement)
- `JWT_SECRET` (required, fails fast if unset), `JWT_EXPIRES_IN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (all required, fail fast if unset)
- `AI_SERVICE_URL` — **optional**, defaults to `http://localhost:8000`. Unlike the variables above, this one deliberately does *not* fail fast — the AI service being unset or unreachable must never prevent the backend from starting or handling requests.

## API Overview

- `GET /api/health`, `GET /api/health/db` — health checks
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` — authentication (JWT)
- `POST /api/items/upload` — upload up to 5 images (jpg/jpeg/png/webp, 5MB each) to Cloudinary; now also triggers a best-effort AI embedding request per image (see below)
- `POST /api/items/lost`, `GET /api/items/mine`, `GET /api/items/:id` — LOST reports
- `POST /api/items/found`, `GET /api/items/found/mine`, `GET /api/items/found/:id` — FOUND reports

All `/api/items/*` routes require `Authorization: Bearer <token>`.

## AI Service Integration (Milestone 2)

The backend now calls a separate, standalone FastAPI AI service
(`../ai-service`, run independently on `http://localhost:8000` by
default) to generate an image embedding right after each image is
uploaded to Cloudinary. **Embeddings are only logged in this milestone —
nothing is stored in the database yet**, and report creation itself was
not modified at all.

### Where it hooks in

`POST /api/items/upload` is the only place this happens. After
`upload.service.ts` uploads a file to Cloudinary and gets back a real
`imageUrl`, it calls the new `ai.service.ts` with that URL. Report
creation (`POST /api/items/lost`/`found`) only ever consumes already-
uploaded image references and has no AI-service awareness at all — so
"if the AI service is down, report creation continues normally" is true
by construction, not by an added try/catch.

### What's logged

For each successfully embedded image:

```
AI embedding generated for <imageUrl>: dimensions=512, first 5 values=[0.023..., 0.059..., ...]
```

The full embedding vector is never logged. If the AI service is
unreachable, times out, or returns an error, that's logged as a warning
instead, and the upload request **still succeeds normally** — the
`{imageUrl, publicId}` response shape is completely unaffected either way.

### Resilience details

- 5-second timeout per embedding request (`AbortController`), so a
  slow/hung AI service adds bounded latency rather than hanging the
  upload response indefinitely.
- Every failure mode — connection refused, DNS failure, timeout, non-2xx
  response, unexpected response shape — is caught inside `ai.service.ts`
  and turned into `null`. Nothing from this integration can throw an
  uncaught error into the request lifecycle.
- Verified locally: stopped the AI service entirely and confirmed
  `POST /api/items/upload` still returns `201` with the upload succeeding
  normally, with a warning logged server-side.

### Future: storing embeddings in the database

Not implemented yet, by design — but the shape of this integration was
chosen to make it a small addition later, not a restructure:

- `getImageEmbedding()` already returns the parsed `{dimensions, embedding}`
  result (or `null`) directly to its caller in `upload.service.ts`, in the
  same request lifecycle as the Cloudinary upload. Persisting it is a
  matter of adding a field to the `ReportImage` model (e.g. an
  `embedding Float[]` column, or a separate `ImageEmbedding` table if
  keeping `ReportImage` lean is preferred) and one additional
  `prisma.reportImage.update(...)` call where the embedding is currently
  only logged.
- Because report creation reads images back via `include: { images: true }`
  already, an embedding column added to `ReportImage` would automatically
  flow through every existing report response with zero controller changes.
