import { Route } from 'react-router-dom'
import { CorporateDashboardPage } from '../panels/corporate/pages/CorporateDashboardPage.jsx'
import { CorporateRequestsPage } from '../panels/corporate/pages/CorporateRequestsPage.jsx'
import { CorporateRequestNewPage } from '../panels/corporate/pages/CorporateRequestNewPage.jsx'
import { CorporateRequestDetailPage } from '../panels/corporate/pages/CorporateRequestDetailPage.jsx'
import { CorporateAttendancePage } from '../panels/corporate/pages/CorporateAttendancePage.jsx'
import { CorporateBillingPage } from '../panels/corporate/pages/CorporateBillingPage.jsx'
import { CorporateInvoicePage } from '../panels/corporate/pages/CorporateInvoicePage.jsx'
import { CorporateAnalyticsPage } from '../panels/corporate/pages/CorporateAnalyticsPage.jsx'
import { CorporateProfilePage } from '../panels/corporate/pages/CorporateProfilePage.jsx'
import { CorporateSupportPage } from '../panels/corporate/pages/CorporateSupportPage.jsx'
import { CorporateSubscriptionPage } from '../panels/corporate/pages/CorporateSubscriptionPage.jsx'
import { BuildMartHomePage } from '../pages/app/buildmart/BuildMartHomePage.jsx'
import { BuildMartProductPage } from '../pages/app/buildmart/BuildMartProductPage.jsx'

/** Nested `/corporate/*` routes — Fragment of `<Route>` nodes for React Router. */
export const corporateChildRoutes = (
  <>
    <Route index element={<CorporateDashboardPage />} />
    <Route path="requests" element={<CorporateRequestsPage />} />
    <Route path="requests/new" element={<CorporateRequestNewPage />} />
    <Route path="requests/:id" element={<CorporateRequestDetailPage />} />
    <Route path="attendance" element={<CorporateAttendancePage />} />
    <Route path="billing" element={<CorporateBillingPage />} />
    <Route path="billing/invoice/:id" element={<CorporateInvoicePage />} />
    <Route path="analytics" element={<CorporateAnalyticsPage />} />
    <Route path="profile" element={<CorporateProfilePage />} />
    <Route path="support" element={<CorporateSupportPage />} />
    <Route path="subscription" element={<CorporateSubscriptionPage />} />
    <Route path="mart" element={<BuildMartHomePage />} />
    <Route path="mart/product/:productId" element={<BuildMartProductPage />} />
  </>
)
