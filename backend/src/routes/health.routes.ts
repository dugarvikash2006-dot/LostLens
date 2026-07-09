import { Router } from 'express'
import { getHealth } from '../controllers/health.controller'
import { getDbHealth } from '../controllers/db-health.controller'

const router = Router()

router.get('/health', getHealth)
router.get('/health/db', getDbHealth)

export default router
