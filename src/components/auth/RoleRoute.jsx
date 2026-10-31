import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

/**
 * Restricts a route to specific `user.role` values (matches backend User.role enum).
 * If unauthenticated, redirects to /b2c/auth.
 */
export function RoleRoute({ allow, children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/b2c/auth" replace state={{ from: null }} />
  }

  if (!allow?.length || !user?.role || !allow.includes(user.role)) {
    return <Navigate to="/app" replace />
  }
  
  return children
}
