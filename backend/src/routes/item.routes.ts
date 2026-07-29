import { Router } from 'express'
import {
  createLostReport,
  getMyLostReports,
  getLostReportById,
  deleteLostReport,
  browseLostReports,
  reuniteLostReport,
  createFoundReport,
  getMyFoundReports,
  getFoundReportById,
  deleteFoundReport,
  browseFoundReports,
  reuniteFoundReport,
  getStats,
} from '../controllers/item.controller'
import { uploadItemImages } from '../controllers/upload.controller'
import { requireAuth } from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validate.middleware'
import { handleImageUpload } from '../middleware/upload.middleware'
import {
  createLostReportSchema,
  createFoundReportSchema,
  reuniteReportSchema,
} from '../validators/item.validator'

const router = Router()

// Phase 8: deliberately registered before `router.use(requireAuth)`
// below — the Home page's stats are meant for every visitor, signed in
// or not, unlike every other route in this file.
router.get('/stats', getStats)

// Every route below this line requires authentication.
router.use(requireAuth)

// Image upload (Phase 3C) — uploads to Cloudinary and returns
// references; reports are created separately using those references.
router.post('/upload', handleImageUpload, uploadItemImages)

// LOST reports (Phase 3A)
router.post('/lost', validateBody(createLostReportSchema), createLostReport)
router.get('/mine', getMyLostReports)
// Literal route, same reasoning as "/found/browse" below — must be
// registered before the "/:id" catch-all.
router.get('/browse', browseLostReports)
router.patch('/:id/reunite', validateBody(reuniteReportSchema), reuniteLostReport)

// FOUND reports (Phase 3B)
router.post('/found', validateBody(createFoundReportSchema), createFoundReport)
// Literal routes must be registered before the param route below —
// otherwise "/found/mine" would be captured by "/found/:id" with id="mine".
router.get('/found/mine', getMyFoundReports)
router.get('/found/browse', browseFoundReports)
router.get('/found/:id', getFoundReportById)
router.delete('/found/:id', deleteFoundReport)
router.patch('/found/:id/reunite', validateBody(reuniteReportSchema), reuniteFoundReport)

// Generic LOST-report-by-id — kept last since ":id" would otherwise
// swallow any literal path (e.g. "found", "upload", "browse", "mine")
// registered after it.
router.get('/:id', getLostReportById)
router.delete('/:id', deleteLostReport)

export default router
