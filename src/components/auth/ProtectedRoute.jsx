import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { USER_ROLES } from '../../constants/userRoles.js'
import { BOOT_ROUTES } from '../../constants/bootFlow.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { AppRouteLoader } from '../app/AppRouteLoader.jsx'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()
  const role = user?.role

  if (loading) {
    return <AppRouteLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to={BOOT_ROUTES.SPLASH} replace state={{ from: location.pathname }} />
  }

  if (roles?.length && role && !roles.includes(role)) {
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return children
}
