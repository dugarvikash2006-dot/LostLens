import type { NextFunction, Request, Response } from 'express'
import * as itemService from '../services/item.service'
import { AppError } from '../utils/app-error'

export async function createLostReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      // requireAuth always populates this before this handler runs; this
      // guard exists purely for type safety.
      throw new AppError(401, 'Authentication required.')
    }

    const report = await itemService.createLostReport(req.user.id, req.body)

    res.status(201).json({
      success: true,
      message: 'Lost report created successfully',
      data: { report },
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyLostReports(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const reports = await itemService.getMyLostReports(req.user.id)

    res.status(200).json({
      success: true,
      data: { reports },
    })
  } catch (error) {
    next(error)
  }
}

export async function getLostReportById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const report = await itemService.getLostReportById(req.params.id, req.user.id)

    res.status(200).json({
      success: true,
      data: { report },
    })
  } catch (error) {
    next(error)
  }
}
