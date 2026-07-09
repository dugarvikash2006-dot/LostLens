import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import healthRoutes from './routes/health.routes'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json())

app.use('/api', healthRoutes)

export default app
