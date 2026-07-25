import type { NextFunction, Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { AppError } from '../utils/app-error'

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.signup(req.body)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token },
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.login(req.body)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    })
  } catch (error) {
    next(error)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      // requireAuth always populates this before getMe runs; this guard
      // exists purely for type safety, not as an expected runtime path.
      throw new AppError(401, 'Authentication required.')
    }

    const user = await authService.getCurrentUser(req.user.id)

    res.status(200).json({
      success: true,
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}
