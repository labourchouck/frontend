import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { AppRouteLoader } from '../app/AppRouteLoader.jsx'
import { CORPORATE_ROLES, VENDOR_ROLES } from '../../constants/panelRoles.js'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()
  const role = user?.role

  if (loading) {
    return <AppRouteLoader />
  }

  if (!isAuthenticated || !user) {
    const isB2B =
      location.pathname.startsWith('/corporate') ||
      location.pathname.startsWith('/vendor') ||
      roles?.some((r) => CORPORATE_ROLES.includes(r) || VENDOR_ROLES.includes(r))

    const isAdmin = location.pathname.startsWith('/admin')

    const authPath = isAdmin ? '/admin/login' : isB2B ? '/b2b/auth' : '/b2c/auth'

    return <Navigate to={authPath} replace state={{ from: null }} />
  }

  if (roles?.length && role && !roles.includes(role)) {
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return children
}
