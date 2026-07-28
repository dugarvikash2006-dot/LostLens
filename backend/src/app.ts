import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import healthRoutes from './routes/health.routes'
import authRoutes from './routes/auth.routes'
import itemRoutes from './routes/item.routes'
import matchingRoutes from './routes/matching.routes'
import suggestionRoutes from './routes/suggestion.routes'
import { errorHandler } from './middleware/error.middleware'
import { AppError } from './utils/app-error'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json())

app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/matching', matchingRoutes)
app.use('/api/suggestions', suggestionRoutes)

// Unmatched routes get the same safe JSON error shape as everything else,
// instead of Express's default HTML 404 page.
app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found.'))
})

// Centralized error handler — must be registered last.
app.use(errorHandler)

export default app
