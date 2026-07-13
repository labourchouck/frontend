import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { AppShell } from './layouts/AppShell.jsx'
import { CorporateShell } from './layouts/CorporateShell.jsx'
import { VendorAppShell } from './layouts/VendorAppShell.jsx'
import { AdminLayout } from './layouts/AdminLayout.jsx'
import { LandingPage } from './pages/LandingPage'
import { AuthEntryPage } from './pages/auth/AuthEntryPage.jsx'
import { LabourCategoriesPage } from './pages/app/LabourCategoriesPage.jsx'
import { appShellChildRoutes } from './routes/appRoutes.jsx'
import { bootRoutes } from './routes/bootRoutes.jsx'
import { corporateChildRoutes } from './routes/corporateRoutes.jsx'
import { vendorChildRoutes } from './routes/vendorRoutes.jsx'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage.jsx'
import { AdminSubCategoriesPage } from './pages/admin/AdminSubCategoriesPage.jsx'
import { AdminServicesPage } from './pages/admin/AdminServicesPage.jsx'
import { AdminLoginPage } from './pages/admin/AdminLoginPage.jsx'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx'
import { AdminUsersPage } from './pages/admin/AdminUsersPage.jsx'
import { AdminLabourPage } from './pages/admin/AdminLabourPage.jsx'
import { AdminBusinessVerificationPage } from './pages/admin/AdminBusinessVerificationPage.jsx'
import { AdminBuildMartLeadsPage } from './pages/admin/AdminBuildMartLeadsPage.jsx'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage.jsx'
import { AdminAllocationsPage } from './pages/admin/AdminAllocationsPage.jsx'
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage.jsx'
import { AdminBillingPage } from './pages/admin/AdminBillingPage.jsx'
import { AdminPricingPage } from './pages/admin/AdminPricingPage.jsx'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.jsx'
import { AdminModulePlaceholder } from './components/admin/AdminModulePlaceholder.jsx'
import { AdminReportsPage } from './pages/admin/AdminReportsPage.jsx'
import { AdminBannersPage } from './pages/admin/AdminBannersPage.jsx'
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage.jsx'
import { AdminProfilePage } from './pages/admin/AdminProfilePage.jsx'
import { AdminZonesPage } from './pages/admin/AdminZonesPage.jsx'
import { AdminTimeSlotsPage } from './pages/admin/AdminTimeSlotsPage.jsx'

import { BroadcastPopup } from './components/app/BroadcastPopup.jsx'
import { APP_B2C_ROLES, CORPORATE_ROLES, VENDOR_ROLES } from './constants/panelRoles.js'
import { USER_ROLES } from './constants/userRoles.js'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {bootRoutes}
          <Route path="/auth" element={<AuthEntryPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute roles={APP_B2C_ROLES} allowGuest>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {appShellChildRoutes}
          </Route>
          <Route
            path="/app/work-categories"
            element={
              <ProtectedRoute roles={[USER_ROLES.LABOUR]}>
                <LabourCategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/corporate"
            element={
              <ProtectedRoute roles={CORPORATE_ROLES}>
                <CorporateShell />
              </ProtectedRoute>
            }
          >
            {corporateChildRoutes}
          </Route>

          <Route
            path="/vendor"
            element={
              <ProtectedRoute roles={VENDOR_ROLES}>
                <VendorAppShell />
              </ProtectedRoute>
            }
          >
            {vendorChildRoutes}
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={[USER_ROLES.ADMIN]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="sub-categories" element={<AdminSubCategoriesPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="labour" element={<AdminLabourPage />} />
            <Route path="business-verification" element={<AdminBusinessVerificationPage />} />
            <Route path="buildmart" element={<AdminBuildMartLeadsPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="allocations" element={<AdminAllocationsPage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="billing" element={<AdminBillingPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="complaints" element={<AdminComplaintsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="zones" element={<AdminZonesPage />} />
            <Route path="time-slots" element={<AdminTimeSlotsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BroadcastPopup />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
