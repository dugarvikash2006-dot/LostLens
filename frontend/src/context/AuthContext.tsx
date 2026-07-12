import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { loginRequest, signupRequest, meRequest } from '../api/auth.api'
import type { LoginPayload, SignupPayload } from '../api/auth.api'
import { ApiError } from '../api/client'
import { clearStoredToken, getStoredToken, setStoredToken } from '../utils/tokenStorage'
import type { User } from '../types/auth'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On startup: if a token is stored, ask the backend who it belongs to
  // via /api/auth/me rather than trusting the token's contents directly.
  // Everything (including the "no token" case) resolves through the same
  // async function + .finally(), so no state is ever set synchronously
  // in the effect body itself — only from callbacks, which is the
  // React-recommended pattern for data-fetching effects. The `cancelled`
  // flag keeps this correct under React StrictMode's dev-only
  // double-invoke: the first invocation's result is discarded via this
  // flag, and only the second, "real" one updates state.
  useEffect(() => {
    let cancelled = false
    const token = getStoredToken()

    const restoreSession = async () => {
      if (!token) return

      try {
        const response = await meRequest(token)
        if (!cancelled) {
          setUser(response.data.user)
        }
      } catch (error) {
        if (cancelled) return

        // Only a confirmed auth failure (401 — invalid/expired token, or
        // the user no longer exists) should clear the stored token. A
        // temporary network/server failure leaves it in place, so a
        // brief backend hiccup doesn't silently log the user out.
        if (error instanceof ApiError && error.status === 401) {
          clearStoredToken()
        }
        setUser(null)
      }
    }

    restoreSession().finally(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const signup = useCallback(async (payload: SignupPayload) => {
    const response = await signupRequest(payload)
    setStoredToken(response.data.token)
    setUser(response.data.user)
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload)
    setStoredToken(response.data.token)
    setUser(response.data.user)
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
