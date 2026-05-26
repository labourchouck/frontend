import { useAuth } from '../../../hooks/useAuth.js'
import { VendorHomeScreen } from '../VendorHomeScreen.jsx'

export function VendorDashboardPage() {
  const { user } = useAuth()
  return <VendorHomeScreen user={user} />
}
