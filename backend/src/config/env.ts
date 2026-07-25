import dotenv from 'dotenv'

dotenv.config()

// Fails fast and clearly at startup if a required variable is missing —
// intentionally never logs the actual value, only the variable name.
function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Authentication (Phase 2C)
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Image uploads (Phase 3C)
  cloudinaryCloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: requireEnv('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: requireEnv('CLOUDINARY_API_SECRET'),
  // AI service (Milestone 2) — optional. If unset or unreachable,
// image uploads still succeed; embeddings just aren't generated.
aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
}
