import { USER_ROLES, KYC_STATUS } from '../constants/userRoles.js'

/**
 * A labour worker only takes part in the app (jobs, broadcasts, earnings…) once the admin has approved their KYC.
 * Until then they are held on the verification screen. Other roles are never locked.
 */
export function isLabourLocked(user) {
  return user?.role === USER_ROLES.LABOUR && user?.labourProfile?.kycStatus !== KYC_STATUS.VERIFIED
}

/** Screens a locked labour may still open: verification itself and help / legal pages. */
const LOCKED_ALLOWED_PREFIXES = ['/app/kyc', '/app/support', '/app/terms', '/app/privacy-policy', '/app/faq']

export function isPathAllowedWhileLocked(pathname) {
  return LOCKED_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
