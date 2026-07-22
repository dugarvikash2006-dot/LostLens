import { Router } from 'express'
import { getMatches } from '../controllers/matching.controller'

const router = Router()

router.get('/:reportId', getMatches)

export default router