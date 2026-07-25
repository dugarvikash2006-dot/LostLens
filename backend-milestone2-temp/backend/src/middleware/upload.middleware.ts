import multer from 'multer'
import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/app-error'

export const MAX_IMAGES = 5
export const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Memory storage only — files are streamed straight to Cloudinary and
// never written to disk or stored as binary data anywhere ourselves.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_IMAGES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(new Error('Only JPG, PNG, and WEBP images are allowed.'))
      return
    }
    callback(null, true)
  },
})

const uploadImagesField = upload.array('images', MAX_IMAGES)

/**
 * Wraps Multer so its errors (oversized file, too many files, rejected
 * mime type) become the same safe AppError JSON shape as the rest of the
 * API, instead of an unhandled exception or Multer's own error format.
 */
export function handleImageUpload(req: Request, res: Response, next: NextFunction) {
  uploadImagesField(req, res, (error: unknown) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(400, `Each image must be at most ${MAX_FILE_SIZE_MB}MB.`))
        return
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new AppError(400, `You can upload at most ${MAX_IMAGES} images.`))
        return
      }
      next(new AppError(400, 'Invalid image upload.'))
      return
    }

    // Anything else is our fileFilter's rejection message (safe, written
    // by us above) or another Error — either way, its .message is safe
    // to surface directly here.
    const message = error instanceof Error ? error.message : 'Invalid image upload.'
    next(new AppError(400, message))
  })
}
