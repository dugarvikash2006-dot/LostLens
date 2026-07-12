import { Router } from 'express'
import {
  createLostReport,
  getMyLostReports,
  getLostReportById,
} from '../controllers/item.controller'
import { requireAuth } from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validate.middleware'
import { createLostReportSchema } from '../validators/item.validator'

const router = Router()

// Every route in this file requires authentication.
router.use(requireAuth)

router.post('/lost', validateBody(createLostReportSchema), createLostReport)
router.get('/mine', getMyLostReports)
router.get('/:id', getLostReportById)

export default router
