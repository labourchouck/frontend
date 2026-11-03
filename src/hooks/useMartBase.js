import { useLocation } from 'react-router-dom'
import { martBasePath } from '../lib/buildmartLeadStatus.js'

/** Base path of the Mart in the app the user is in: `/app/buildmart` (individual, labour) or `/corporate/mart`. */
export function useMartBase() {
  const { pathname } = useLocation()
  return martBasePath(pathname)
}
