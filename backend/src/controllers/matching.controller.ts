import { Request, Response, NextFunction } from 'express'
import { MatchingService } from '../services/matching.service'
import { AppError } from '../utils/app-error'

const matchingService = new MatchingService()

export async function getMatches(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      // requireAuth always populates this before this handler runs; this
      // guard exists purely for type safety.
      throw new AppError(401, 'Authentication required.')
    }

    const { reportId } = req.params

    const matches = await matchingService.findMatches(reportId, req.user.id)

    res.status(200).json({
      success: true,
      matches,
    })
  } catch (error) {
    next(error)
  }
}