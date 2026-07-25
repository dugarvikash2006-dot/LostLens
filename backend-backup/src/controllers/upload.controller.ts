import type { NextFunction, Request, Response } from 'express'
import * as uploadService from '../services/upload.service'
import { AppError } from '../utils/app-error'

export async function uploadItemImages(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      // requireAuth always populates this before this handler runs; this
      // guard exists purely for type safety.
      throw new AppError(401, 'Authentication required.')
    }

    const files = req.files as Express.Multer.File[] | undefined

    if (!files || files.length === 0) {
      throw new AppError(400, 'At least one image file is required.')
    }

    const images = await uploadService.uploadReportImages(files)

    res.status(201).json({
      success: true,
      data: { images },
    })
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }

    // Cloudinary/network failures land here — never leak the raw error
    // (which could include request details) to the client.
    console.error('Image upload failed:', error)
    next(new AppError(502, 'Image upload failed. Please try again.'))
  }
}
