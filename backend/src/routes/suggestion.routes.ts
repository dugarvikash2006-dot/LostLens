import { Router } from 'express'
import { getSuggestions } from '../controllers/suggestion.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

// Every route in this file requires authentication, matching the
// authorization rules applied to item.routes.ts and matching.routes.ts.
router.use(requireAuth)

router.get('/:reportId', getSuggestions)

export default router
