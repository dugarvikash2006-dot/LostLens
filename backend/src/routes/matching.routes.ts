import { Router } from 'express'
import { getMatches } from '../controllers/matching.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

// Every route in this file requires authentication, matching the
// authorization rules applied to item.routes.ts.
router.use(requireAuth)

router.get('/:reportId', getMatches)

export default router