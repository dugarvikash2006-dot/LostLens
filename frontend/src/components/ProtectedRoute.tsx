import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Wrap a route's element with this to require authentication.
 * No routes use this yet in Phase 2D — it's infrastructure for future
 * pages (e.g. a dashboard) that will need to be logged-in-only.
 *
 * Usage once such a route exists:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    // Preserve the intended destination so login can send the user back
    // here afterwards, once a login flow makes use of location.state.from.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
