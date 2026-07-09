# LostLens Backend

Phase 2A: Express + TypeScript backend foundation for the LostLens platform.

This phase sets up the server skeleton only — no database, ORM, authentication,
or business logic yet. Those arrive in later phases.

## Tech Stack

- Node.js
- Express
- TypeScript
- dotenv, cors, helmet

## Project Structure

```
backend/
├── src/
│   ├── config/       # Environment configuration
│   ├── controllers/  # Request handlers
│   ├── middleware/    # (reserved for future middleware)
│   ├── routes/        # Route definitions
│   ├── services/      # (reserved for future business logic)
│   ├── utils/          # (reserved for future helpers)
│   ├── app.ts          # Express app configuration
│   └── server.ts       # Server startup
├── .env.example
├── package.json
└── tsconfig.json
```

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

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

## Health Endpoint

Once the server is running:

```
GET http://localhost:5000/api/health
```

Response:

```json
{
  "success": true,
  "message": "LostLens API is running"
}
```
