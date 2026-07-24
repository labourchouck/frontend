import { Route } from 'react-router-dom'
import { VendorDashboardPage } from '../panels/vendor/pages/VendorDashboardPage.jsx'
import { VendorCrewPage } from '../panels/vendor/pages/VendorCrewPage.jsx'
import { VendorCrewNewPage } from '../panels/vendor/pages/VendorCrewNewPage.jsx'
import { VendorJobsPage } from '../panels/vendor/pages/VendorJobsPage.jsx'
import { VendorJobDetailPage } from '../panels/vendor/pages/VendorJobDetailPage.jsx'
import { VendorAttendancePage } from '../panels/vendor/pages/VendorAttendancePage.jsx'
import { VendorEarningsPage } from '../panels/vendor/pages/VendorEarningsPage.jsx'
import { VendorProfilePage } from '../panels/vendor/pages/VendorProfilePage.jsx'
import { VendorSupportPage } from '../panels/vendor/pages/VendorSupportPage.jsx'
import { VendorAnalyticsPage } from '../panels/vendor/pages/VendorAnalyticsPage.jsx'
import { VendorMartPage } from '../panels/vendor/pages/VendorMartPage.jsx'
import { VendorMartProductCreatePage } from '../panels/vendor/pages/VendorMartProductCreatePage.jsx'
import { VendorMartProductsListPage } from '../panels/vendor/pages/VendorMartProductsListPage.jsx'

/** Nested `/vendor/*` routes — Fragment of `<Route>` nodes for React Router. */
export const vendorChildRoutes = (
  <>
    <Route index element={<VendorDashboardPage />} />
    <Route path="crew" element={<VendorCrewPage />} />
    <Route path="crew/new" element={<VendorCrewNewPage />} />
    <Route path="jobs" element={<VendorJobsPage />} />
    <Route path="jobs/:id" element={<VendorJobDetailPage />} />
    <Route path="attendance" element={<VendorAttendancePage />} />
    <Route path="earnings" element={<VendorEarningsPage />} />
    <Route path="analytics" element={<VendorAnalyticsPage />} />
    <Route path="profile" element={<VendorProfilePage />} />
    <Route path="support" element={<VendorSupportPage />} />
    <Route path="mart">
      <Route index element={<VendorMartPage />} />
      <Route path="category/:categoryId" element={<VendorMartProductCreatePage />} />
      <Route path="products" element={<VendorMartProductsListPage />} />
    </Route>
  </>
)
