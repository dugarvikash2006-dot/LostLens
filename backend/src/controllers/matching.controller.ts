import { Request, Response, NextFunction } from 'express'
import { MatchingService } from '../services/matching.service'

const matchingService = new MatchingService()

export async function getMatches(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { reportId } = req.params

    const matches = await matchingService.findMatches(reportId)

    res.status(200).json({
      success: true,
      matches,
    })
  } catch (error) {
    next(error)
  }
}