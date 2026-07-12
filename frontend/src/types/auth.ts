// Types mirroring the real Phase 2C backend contract exactly.
// Keep these in sync with backend/src/services/auth.service.ts and
// backend/src/validators/auth.validator.ts if either changes.

export type Role = 'USER' | 'ADMIN'

export interface User {
  id: string
  fullName: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthSuccessData {
  user: User
  token: string
}

export interface SignupResponse {
  success: true
  message: string
  data: AuthSuccessData
}

export interface LoginResponse {
  success: true
  message: string
  data: AuthSuccessData
}

export interface MeResponse {
  success: true
  data: {
    user: User
  }
}

export interface ApiErrorField {
  field: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: ApiErrorField[]
}
