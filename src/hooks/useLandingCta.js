import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import { USER_ROLES } from '../constants/userRoles.js'
import { writeBootRole } from '../lib/bootPersona.js'

/**
 * Shared CTA handlers for the landing page. B2C entries reuse the guest
 * "boot persona" flow; B2B entries deep-link the auth page with a default role.
 */
export function useLandingCta() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const enterAsBootRole = (role) => (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (user && user.role === role) {
      window.location.href = '/app'
      return
    }
    logout().finally(() => {
      writeBootRole(role)
      window.location.href = '/app'
    })
  }

  const goB2b = (role) => (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (user && user.role === role) {
      navigate(role === USER_ROLES.CORPORATE ? '/corporate' : '/vendor')
      return
    }
    navigate('/b2b/auth', { state: { defaultRole: role } })
  }

  return {
    hireLabour: enterAsBootRole(USER_ROLES.INDIVIDUAL),
    registerLabour: enterAsBootRole(USER_ROLES.LABOUR),
    corporate: goB2b(USER_ROLES.CORPORATE),
    vendor: goB2b(USER_ROLES.CONTRACTOR),
    buildMart: (e) => {
      if (e && e.preventDefault) e.preventDefault()
      if (user && user.role === USER_ROLES.CORPORATE) {
        navigate('/corporate/mart')
        return
      }
      if (user && user.role === USER_ROLES.CONTRACTOR) {
        navigate('/vendor/mart')
        return
      }
      if (user && (user.role === USER_ROLES.INDIVIDUAL || user.role === USER_ROLES.LABOUR)) {
        window.location.href = '/app/buildmart'
        return
      }
      logout().finally(() => {
        writeBootRole(USER_ROLES.INDIVIDUAL)
        window.location.href = '/app/buildmart'
      })
    },
  }
}
