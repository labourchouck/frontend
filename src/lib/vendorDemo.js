export function isVendorPanelUnlocked(user) {
  return user?.contractorProfile?.verificationStatus === 'approved'
}
