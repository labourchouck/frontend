import { useAuth } from '../../../hooks/useAuth.js'
import { DynamicLegalDocument } from '../../../components/legal/DynamicLegalDocument.jsx'

export function VendorPrivacyPolicyPage() {
  const { user } = useAuth()
  return (
    <div className="w-full pb-28">
      <DynamicLegalDocument kind="privacy" role={user?.role || 'contractor'} variant="vendor" />
    </div>
  )
}
