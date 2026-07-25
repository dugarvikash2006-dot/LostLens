import { Router } from 'express'
import { signup, login, getMe } from '../controllers/auth.controller'
import { validateBody } from '../middleware/validate.middleware'
import { requireAuth } from '../middleware/auth.middleware'
import { signupSchema, loginSchema } from '../validators/auth.validator'

const router = Router()

router.post('/signup', validateBody(signupSchema), signup)
router.post('/login', validateBody(loginSchema), login)
router.get('/me', requireAuth, getMe)

export default router
