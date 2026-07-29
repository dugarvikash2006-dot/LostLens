import type { NextFunction, Request, Response } from 'express'
import * as itemService from '../services/item.service'
import { AppError } from '../utils/app-error'
import { browseReportsQuerySchema } from '../validators/item.validator'
import type { BrowseReportsQuery } from '../validators/item.validator'

const DEFAULT_BROWSE_QUERY: BrowseReportsQuery = {
  search: undefined,
  category: undefined,
  status: undefined,
  sort: 'newest',
}

// Query-string values are always strings-or-absent; this never actually
// rejects a request — every field in the schema has a `.catch()`
// fallback — but req.query's type is broader than the schema expects
// (e.g. a repeated param becomes an array), so parsing defensively here
// avoids a 500 for a malformed query rather than degrading to defaults.
function parseBrowseQuery(query: Request['query']): BrowseReportsQuery {
  const result = browseReportsQuerySchema.safeParse(query)
  return result.success ? result.data : DEFAULT_BROWSE_QUERY
}

// ---------------- LOST reports (Phase 3A — behavior unchanged) ----------------

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

export async function deleteLostReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    await itemService.deleteLostReport(req.params.id, req.user.id)

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function browseLostReports(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const reports = await itemService.browseLostReports(parseBrowseQuery(req.query))

    res.status(200).json({
      success: true,
      data: { reports },
    })
  } catch (error) {
    next(error)
  }
}

export async function reuniteLostReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const report = await itemService.reuniteLostReport(
      req.params.id,
      req.user.id,
      req.body.reunionMethod,
    )

    res.status(200).json({
      success: true,
      message: 'Report marked as reunited',
      data: { report },
    })
  } catch (error) {
    next(error)
  }
}

// ---------------- FOUND reports (Phase 3B) ----------------

export async function createFoundReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const report = await itemService.createFoundReport(req.user.id, req.body)

    res.status(201).json({
      success: true,
      message: 'Found report created successfully',
      data: { report },
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyFoundReports(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const reports = await itemService.getMyFoundReports(req.user.id)

    res.status(200).json({
      success: true,
      data: { reports },
    })
  } catch (error) {
    next(error)
  }
}

export async function getFoundReportById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const report = await itemService.getFoundReportById(req.params.id, req.user.id)

    res.status(200).json({
      success: true,
      data: { report },
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteFoundReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    await itemService.deleteFoundReport(req.params.id, req.user.id)

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function browseFoundReports(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const reports = await itemService.browseFoundReports(parseBrowseQuery(req.query))

    res.status(200).json({
      success: true,
      data: { reports },
    })
  } catch (error) {
    next(error)
  }
}

export async function reuniteFoundReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required.')
    }

    const report = await itemService.reuniteFoundReport(
      req.params.id,
      req.user.id,
      req.body.reunionMethod,
    )

    res.status(200).json({
      success: true,
      message: 'Report marked as reunited',
      data: { report },
    })
  } catch (error) {
    next(error)
  }
}

// ---------------- Stats (Phase 8) ----------------
// Deliberately public (see item.routes.ts) — the Home page shows these
// to every visitor, signed in or not.

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await itemService.getStats()

    res.status(200).json({
      success: true,
      data: { stats },
    })
  } catch (error) {
    next(error)
  }
}
