import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ClipboardList, Clock, FileText, Plus, Menu, MapPin, Bell, ChevronDown, BarChart3, LifeBuoy, Users, IdCard, ShoppingBag, ArrowRight, Truck, ChevronRight } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { CORPORATE_STATUS } from '../../../constants/userRoles.js'
import { ApprovalGate } from '../../../components/shared/ApprovalGate.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useGetCorporateDashboardQuery, useGetCorporateBannersQuery, useGetCorporateMySubscriptionQuery, useGetMyRequestsQuery } from '../../../store/api/workforceApi.js'
import { AppUserLocationModal } from '../../../components/app/AppUserLocationModal.jsx'
import { readAppUserLocation, formatAppUserLocationLabel } from '../../../lib/appUserLocationStorage.js'

import { fetchAppMartProducts } from '../../../api/buildmartApi.js'

export function CorporateDashboardPage() {
  const { user } = useAuth()
  const approved = user?.corporateProfile?.status === CORPORATE_STATUS.APPROVED
  const { data, isLoading } = useGetCorporateDashboardQuery(undefined, { skip: !approved })
  const { data: bannersData, isLoading: isLoadingBanners } = useGetCorporateBannersQuery(undefined, { skip: !approved })
  const { data: subData } = useGetCorporateMySubscriptionQuery(undefined, { skip: !approved })
  const { data: requestsData, isLoading: isLoadingRequests } = useGetMyRequestsQuery(undefined, { skip: !approved })

  const activeSub = subData?.subscription
  const recentRequests = requestsData?.requests?.slice(0, 5) || []

  const [martProducts, setMartProducts] = useState([])
  const [loadingMart, setLoadingMart] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadMart() {
      try {
        const res = await fetchAppMartProducts()
        if (mounted) {
          setMartProducts(res?.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoadingMart(false)
      }
    }
    loadMart()
    return () => { mounted = false }
  }, [])

  const [locModalOpen, setLocModalOpen] = useState(false)
  const [userLocLabel, setUserLocLabel] = useState('')
  const bannerContainerRef = useRef(null)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  const handleBannerScroll = () => {
    if (bannerContainerRef.current) {
      const { scrollLeft, clientWidth } = bannerContainerRef.current
      const index = Math.round(scrollLeft / clientWidth)
      if (index !== activeBannerIndex) {
        setActiveBannerIndex(index)
      }
    }
  }

  useEffect(() => {
    if (!bannersData?.banners || bannersData.banners.length <= 1) return

    const interval = setInterval(() => {
      const container = bannerContainerRef.current
      if (container) {
        const { scrollLeft, scrollWidth, clientWidth } = container
        
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          container.scrollTo({ left: scrollLeft + clientWidth, behavior: 'smooth' })
        }
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [bannersData])

  useEffect(() => {
    const refreshLoc = () => {
      const loc = readAppUserLocation()
      setUserLocLabel(formatAppUserLocationLabel(loc))
    }
    refreshLoc()
    window.addEventListener('lc-app-user-location-changed', refreshLoc)
    return () => window.removeEventListener('lc-app-user-location-changed', refreshLoc)
  }, [])


  if (!approved) {
    return (
      <div className="space-y-4">
        <ApprovalGate
          title="Corporate approval required"
          message="Upload company documents on your profile. Operations will verify your account before projects and bulk requests unlock."
          profileTo="/corporate/profile"
        />
      </div>
    )
  }

  const stats = data?.stats || {}

  return (
    <>
      {/* Custom Header Block */}
      <div className="-mx-4 -mt-[max(0.5rem,env(safe-area-inset-top,0px))] bg-[#2bb972] px-4 pt-[max(1rem,env(safe-area-inset-top,0.5rem))] pb-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.dispatchEvent(new Event('lc-open-panel-drawer'))}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-all shadow-sm"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div 
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => setLocModalOpen(true)}
            >
              <MapPin className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              <div className="flex flex-col min-w-0 max-w-[180px]">
                <span className="text-[11px] font-medium text-white/90 uppercase tracking-wide truncate">Your location</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white truncate">{userLocLabel || 'Select location'}</span>
                  <ChevronDown className="h-4 w-4 text-white shrink-0" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] bg-white text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/corporate/profile" className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] bg-white text-emerald-600 font-extrabold shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-[15px]">
              {user?.corporateProfile?.companyName?.substring(0, 2).toUpperCase() || 'CP'}
            </Link>
          </div>
        </div>

        {/* Wish Message & Business Details */}
        <div className="flex flex-col items-start justify-start text-left space-y-1">
          <h2 className="text-[20px] sm:text-[22px] font-extrabold text-white leading-tight flex items-center w-full min-w-0">
            <span className="truncate">Good Morning, {user?.fullName || 'User'}</span>
            <span role="img" aria-label="wave" className="shrink-0 ml-1.5 animate-wave">👋</span>
          </h2>
          <p className="text-sm font-bold text-white/95">
            {user?.corporateProfile?.companyName || 'Your Business'}
          </p>
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
              {user?.corporateProfile?.status || 'APPROVED'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Card overlapping the green background */}
      <div className="-mx-4 -mt-5 bg-slate-50 rounded-t-[32px] p-4 sm:p-5 min-h-[50vh] relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] space-y-5">
        <AppSurface flush tone="brandWash" className="border-slate-800/10 bg-slate-900 text-white relative group rounded-2xl overflow-hidden">
          {/* Background Banners */}
          {!isLoadingBanners && bannersData?.banners?.length > 0 && (
            <>
              <div 
                ref={bannerContainerRef}
                onScroll={handleBannerScroll}
                className="absolute inset-0 z-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
              >
                {bannersData.banners.map((banner) => (
                  <img
                    key={banner._id}
                    src={banner.imageUrl}
                    alt="Corporate Banner"
                    className="w-full h-full object-cover snap-center shrink-0"
                  />
                ))}
              </div>

              {/* Pagination Dots */}
              {bannersData.banners.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                  {bannersData.banners.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeBannerIndex ? 'w-4 bg-brand shadow-sm' : 'w-1.5 bg-white/70'}`} 
                    />
                  ))}
                </div>
              )}
            </>
          )}


          {/* Content Wrapper */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-end gap-2 min-h-[140px]">
            {/* Banner content if needed */}
          </div>
        </AppSurface>

        {/* Quick Actions */}
        <section className="pt-2 pb-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Quick actions</h3>
            <Link to="/corporate/requests/new">
              <button type="button" className="inline-flex items-center gap-1.5 bg-brand text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-brand-600 transition-colors shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                New request
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Requests */}
            <Link to="/corporate/requests" className="bg-blue-100 hover:bg-blue-200 transition-colors rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 border border-blue-50/50">
              <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                <ClipboardList className="h-5 w-5 text-[#0066cc]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-800">Requests</span>
            </Link>

            {/* Workforce */}
            <Link to="/corporate/profile" className="bg-purple-100 hover:bg-purple-200 transition-colors rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 border border-purple-50/50">
              <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                <Users className="h-5 w-5 text-[#7c3aed]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-800">Workforce</span>
            </Link>

            {/* Attendance */}
            <Link to="/corporate/attendance" className="bg-amber-100 hover:bg-amber-200 transition-colors rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 border border-amber-50/50">
              <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                <Clock className="h-5 w-5 text-[#9a4d00]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-800">Attendance</span>
            </Link>

            {/* Payouts / Billing */}
            <Link to="/corporate/billing" className="bg-emerald-100 hover:bg-emerald-200 transition-colors rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 border border-emerald-50/50">
              <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                <FileText className="h-5 w-5 text-[#059669]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-800">Billing</span>
            </Link>

            {/* Insights / Analytics */}
            <Link to="/corporate/analytics" className="bg-orange-100 hover:bg-orange-200 transition-colors rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 border border-orange-50/50">
              <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-5 w-5 text-[#b45309]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-800">Insights</span>
            </Link>

            {/* Support */}
            <Link to="/corporate/support" className="bg-rose-100 hover:bg-rose-200 transition-colors rounded-2xl p-2.5 flex flex-col items-center justify-center gap-2 border border-rose-50/50">
              <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shadow-sm">
                <LifeBuoy className="h-5 w-5 text-[#e11d48]" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-slate-800">Support</span>
            </Link>
          </div>
          
          <div className="mt-3">
            {activeSub ? (
              <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 rounded-xl w-10 h-10 flex items-center justify-center border border-emerald-500/30">
                      <IdCard className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-white">{activeSub.plan?.name || 'Active Plan'}</span>
                      <span className="text-[11px] text-emerald-400 font-medium">Active Subscription</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-xs text-slate-400">Bookings</span>
                    <span className="text-sm font-bold text-white">
                      {activeSub.bookingsUsed} / {activeSub.plan?.allowedBookings || activeSub.snapshotPlanDetails?.allowedBookings || 0}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(100, (activeSub.bookingsUsed / (activeSub.plan?.allowedBookings || activeSub.snapshotPlanDetails?.allowedBookings || 1)) * 100)}%` }} 
                  />
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">
                    Started on {new Date(activeSub.startDate).toLocaleDateString()}
                  </span>
                  <Link to="/corporate/subscription" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                    Buy another plan
                  </Link>
                </div>
              </div>
            ) : (
              <Link to="/corporate/subscription" className="bg-slate-800 hover:bg-slate-700 transition-colors rounded-2xl p-3 flex items-center justify-between gap-2 shadow-sm border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-xl w-10 h-10 flex items-center justify-center">
                    <IdCard className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white">Buy Subscription</span>
                    <span className="text-[11px] text-slate-300">View and purchase booking plans</span>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-slate-400 -rotate-90" />
              </Link>
            )}
          </div>
        </section>

        {/* Ongoing Bookings Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Ongoing Bookings</h3>
            <Link to="/corporate/requests" className="text-sm font-bold text-brand hover:text-brand-600 transition-colors">
              View all
            </Link>
          </div>
          
          {isLoadingRequests ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[240px] h-[90px] bg-slate-100 rounded-2xl animate-pulse shrink-0 border border-slate-200/60" />
              ))}
            </div>
          ) : recentRequests.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 px-1">
              {recentRequests.map((r) => (
                <Link 
                  key={r._id} 
                  to={`/corporate/requests/${r._id}`}
                  className="min-w-[260px] snap-start shrink-0 bg-white rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-brand/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-extrabold text-slate-900 truncate">{r.reference || 'Request'}</span>
                      <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        {r.endDate ? ` – ${new Date(r.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                      </span>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${r.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </div>
                  {r.preferredVendorId && (
                     <div className="text-[11px] font-bold text-brand bg-brand-50/50 inline-flex items-center px-2 py-1 rounded-lg w-max max-w-full truncate border border-brand/10">
                       <span className="truncate">Sent to: {r.preferredVendorId.contractorProfile?.businessName || r.preferredVendorId.fullName}</span>
                     </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] mx-1 flex flex-col items-center justify-center gap-2">
              <ClipboardList className="h-8 w-8 text-slate-300" />
              <span className="text-[13px] font-bold text-slate-500">No ongoing bookings</span>
            </div>
          )}
        </section>

        {/* Products / Mart Section */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Products
            </h3>
          </div>
          
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 px-1 -mx-1">
            <div className="w-1 shrink-0" /> {/* Left spacer */}
            {loadingMart ? (
              [1, 2, 3].map(i => (
                <div key={i} className="min-w-[180px] sm:min-w-[220px] h-[240px] bg-slate-100 rounded-2xl animate-pulse shrink-0 border border-slate-200/60" />
              ))
            ) : martProducts.map((p) => (
              <Link 
                key={p.id || p._id} 
                to="/corporate/mart"
                className="w-[180px] min-w-[180px] sm:w-[220px] sm:min-w-[220px] snap-start shrink-0 bg-white rounded-2xl p-2.5 flex flex-col gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-brand/30 hover:shadow-lg transition-all group active:scale-[0.98]"
              >
                <div className="w-full h-[140px] bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100/50">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                  {p.brand && (
                    <span className="absolute top-2 left-2 bg-white/95 text-brand text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide border border-brand/20">
                      {p.brand}
                    </span>
                  )}
                </div>
                <div className="flex flex-col px-1 pt-1 flex-1">
                  <h4 className="text-[14px] font-extrabold text-slate-900 leading-tight group-hover:text-brand transition-colors line-clamp-2 min-h-[40px]">{p.name}</h4>
                  <div className="mt-1">
                    <span className="text-[15px] font-extrabold text-brand">₹{p.basePrice || 0}/{p.unit || 'item'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-medium">
                    <Truck className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.shortDescription || 'Fast delivery available'}</span>
                  </div>
                  
                  <div className="mt-3 mb-1">
                    <div className="w-full flex items-center justify-center gap-1 border border-brand/30 text-brand py-1.5 rounded-xl text-[12px] font-bold group-hover:bg-brand group-hover:text-white transition-colors">
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <div className="w-1 shrink-0" /> {/* Right spacer */}
          </div>

          <div className="flex justify-end mt-1 px-1">
            <Link 
              to="/corporate/mart" 
              className="inline-flex items-center gap-1.5 text-[14px] font-extrabold text-brand hover:text-brand-700 transition-colors group px-3 py-1.5 rounded-lg hover:bg-brand/5 active:scale-95"
            >
              More products
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </div>

      <AppUserLocationModal
        open={locModalOpen}
        onClose={() => setLocModalOpen(false)}
      />
    </>
  )
}


