import type { NextFunction, Request, Response } from 'express'
import * as suggestionService from '../services/suggestion.service'
import { AppError } from '../utils/app-error'

export async function getSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      // requireAuth always populates this before this handler runs; this
      // guard exists purely for type safety.
      throw new AppError(401, 'Authentication required.')
    }

    const { reportId } = req.params
    const suggestions = await suggestionService.getSuggestionsForReport(reportId, req.user.id)

    res.status(200).json({
      success: true,
      data: { suggestions },
    })
  } catch (error) {
    next(error)
  }
}
