import { Router } from 'express'
import {
  createLostReport,
  getMyLostReports,
  getLostReportById,
  createFoundReport,
  getMyFoundReports,
  getFoundReportById,
} from '../controllers/item.controller'
import { uploadItemImages } from '../controllers/upload.controller'
import { requireAuth } from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validate.middleware'
import { handleImageUpload } from '../middleware/upload.middleware'
import { createLostReportSchema, createFoundReportSchema } from '../validators/item.validator'

const router = Router()

// Every route in this file requires authentication.
router.use(requireAuth)

// Image upload (Phase 3C) — uploads to Cloudinary and returns
// references; reports are created separately using those references.
router.post('/upload', handleImageUpload, uploadItemImages)

// LOST reports (Phase 3A)
router.post('/lost', validateBody(createLostReportSchema), createLostReport)
router.get('/mine', getMyLostReports)

// FOUND reports (Phase 3B)
router.post('/found', validateBody(createFoundReportSchema), createFoundReport)
// Literal routes must be registered before the param route below —
// otherwise "/found/mine" would be captured by "/found/:id" with id="mine".
router.get('/found/mine', getMyFoundReports)
router.get('/found/:id', getFoundReportById)

// Generic LOST-report-by-id — kept last since ":id" would otherwise
// swallow any literal path (e.g. "found", "upload") registered after it.
router.get('/:id', getLostReportById)

export default router
