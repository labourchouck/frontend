/** Demo / client review — full vendor panel with dummy data (no API required). */
export const VENDOR_DEMO_MODE = import.meta.env.VITE_VENDOR_DEMO !== 'false'

export function isVendorPanelUnlocked(user) {
  if (VENDOR_DEMO_MODE) return true
  return user?.contractorProfile?.verificationStatus === 'approved'
}
