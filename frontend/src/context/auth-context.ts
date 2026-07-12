import { createContext } from 'react'
import type { LoginPayload, SignupPayload } from '../api/auth.api'
import type { User } from '../types/auth'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  /** True while restoring session state on app startup. */
  isLoading: boolean
  signup: (payload: SignupPayload) => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
