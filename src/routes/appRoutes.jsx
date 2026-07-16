import { Navigate, Route } from 'react-router-dom'
import { RoleRoute } from '../components/auth/RoleRoute.jsx'
import { AppHomePage } from '../pages/app/AppHomePage.jsx'
import { AppBookingsPage } from '../pages/app/AppBookingsPage.jsx'
import { AppJobsPage } from '../pages/app/AppJobsPage.jsx'
import { AppSupportPage } from '../pages/app/AppSupportPage.jsx'
import { AppProfilePage } from '../pages/app/AppProfilePage.jsx'
import { AppEarningsPage } from '../pages/app/AppEarningsPage.jsx'
import { AppAttendancePage } from '../pages/app/AppAttendancePage.jsx'
import { AppKycPage } from '../pages/app/AppKycPage.jsx'
import { LabourNotificationsPage } from '../pages/app/labour/LabourNotificationsPage.jsx'
import { IndividualBookingFlowPage } from '../pages/app/booking/IndividualBookingFlowPage.jsx'
import { BuildMartHomePage } from '../pages/app/buildmart/BuildMartHomePage.jsx'
import { BuildMartProductPage } from '../pages/app/buildmart/BuildMartProductPage.jsx'
import { AppIndividualSearchPage } from '../pages/app/AppIndividualSearchPage.jsx'
import { ServiceCatalog } from '../pages/app/ServiceCatalog.jsx'
import { Checkout } from '../pages/app/Checkout.jsx'
import { JobTracking } from '../pages/app/JobTracking.jsx'
import { MyBookings } from '../pages/app/MyBookings.jsx'
import { ActiveJob } from '../pages/app/ActiveJob.jsx'
import { LaborWallet } from '../pages/app/LaborWallet.jsx'
import { AppSubCategoryServicePage } from '../pages/app/AppSubCategoryServicePage.jsx'
import { USER_ROLES } from '../constants/userRoles.js'

const BUILDMART_ROLES = [USER_ROLES.INDIVIDUAL, USER_ROLES.LABOUR]

export const appShellChildRoutes = (
  <>
    <Route index element={<AppHomePage />} />
    <Route path="discover/labours" element={<Navigate to="/app" replace />} />
    <Route
      path="booking/flow"
      
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL, USER_ROLES.LABOUR]} allowGuest>
          <IndividualBookingFlowPage />
        </RoleRoute>
      }
    />
    <Route
      path="bookings"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL, USER_ROLES.LABOUR]}>
          <AppBookingsPage />
        </RoleRoute>
      }
    />
    <Route
      path="search"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL]} allowGuest>
          <AppIndividualSearchPage />
        </RoleRoute>
      }
    />
    {/* New: Service Catalog */}
    <Route
      path="services"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL]} allowGuest>
          <ServiceCatalog />
        </RoleRoute>
      }
    />
    {/* New: Sub Category Service Page */}
    <Route
      path="sub-category/:id"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL]} allowGuest>
          <AppSubCategoryServicePage />
        </RoleRoute>
      }
    />
    {/* New: Checkout */}
    <Route
      path="checkout"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL]} allowGuest>
          <Checkout />
        </RoleRoute>
      }
    />
    {/* New: Job Tracking */}
    <Route
      path="tracking/:bookingId"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL]}>
          <JobTracking />
        </RoleRoute>
      }
    />
    {/* New: My Bookings (API-backed) */}
    <Route
      path="my-bookings"
      element={
        <RoleRoute allow={[USER_ROLES.INDIVIDUAL, USER_ROLES.LABOUR]}>
          <MyBookings />
        </RoleRoute>
      }
    />
    {/* New: Active Job (Labour) */}
    <Route
      path="active-job/:bookingId"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <ActiveJob />
        </RoleRoute>
      }
    />
    {/* New: Labor Wallet */}
    <Route
      path="wallet"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <LaborWallet />
        </RoleRoute>
      }
    />
    <Route
      path="buildmart"
      element={
        <RoleRoute allow={BUILDMART_ROLES} allowGuest>
          <BuildMartHomePage />
        </RoleRoute>
      }
    />
    <Route
      path="buildmart/product/:productId"
      element={
        <RoleRoute allow={BUILDMART_ROLES} allowGuest>
          <BuildMartProductPage />
        </RoleRoute>
      }
    />
    <Route
      path="jobs"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppJobsPage />
        </RoleRoute>
      }
    />
    <Route path="support" element={<AppSupportPage />} />
    <Route path="profile" element={<AppProfilePage />} />
    <Route
      path="earnings"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppEarningsPage />
        </RoleRoute>
      }
    />
    <Route
      path="attendance"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppAttendancePage />
        </RoleRoute>
      }
    />
    <Route
      path="kyc"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppKycPage />
        </RoleRoute>
      }
    />
    <Route
      path="notifications"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <LabourNotificationsPage />
        </RoleRoute>
      }
    />
  </>
)

