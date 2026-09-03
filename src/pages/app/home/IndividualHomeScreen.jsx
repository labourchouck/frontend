import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Zap, CalendarClock, Shield, ChevronRight } from 'lucide-react'
import LottieExport from 'lottie-react'
const Lottie = LottieExport.default || LottieExport

const TypewriterText = ({ text, className }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText(''); // Reset on mount
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i));
        i++;
      } else {
        // Pause for 2 seconds (20 ticks) at the end, then loop
        if (i > text.length + 20) {
          i = 0;
        } else {
          i++;
        }
      }
    }, 100); // 100ms per tick
    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayedText || '\u00A0'}</span>;
};
import instantAnimation from '../../../assets/lotties/booking (1).json'
import scheduleAnimation from '../../../assets/lotties/schedule.json'
import { fetchLabourCategoriesGrouped } from '../../../api/labourCategoriesApi.js'
import { IndividualHomeCategoryGrid } from '../../../components/app/individual/IndividualHomeCategoryGrid.jsx'
import { IndividualHomeCategoryRail } from '../../../components/app/individual/IndividualHomeCategoryRail.jsx'
import { IndividualHomeHeroCarousel } from '../../../components/app/individual/IndividualHomeHeroCarousel.jsx'
import { IndividualHomeRecentlyBooked } from '../../../components/app/individual/IndividualHomeRecentlyBooked.jsx'
import { IndividualHomeWorkerCarousel } from '../../../components/app/individual/IndividualHomeWorkerCarousel.jsx'
import { IndividualHomeServiceSections } from '../../../components/app/individual/IndividualHomeServiceSections.jsx'
import { IndividualHomeProductCarousel } from '../../../components/app/individual/IndividualHomeProductCarousel.jsx'
import { BookingModeSheet } from '../../../components/app/booking/BookingModeSheet.jsx'
import { BookingTypeSheet } from '../../../components/app/booking/BookingTypeSheet.jsx'
import { writeBookingDraft, readBookingDraft } from '../../../lib/individualBookingDraft.js'
import { fetchDiscoverLabour, fetchDiscoverLabours } from '../../../api/discoverLaboursApi.js'
import { fetchAppMartProducts } from '../../../api/buildmartApi.js'
import { bookingsApi } from '../../../api/bookingsApi.js'
import { ApiError } from '../../../api/http.js'
import { userSubscriptionApi } from '../../../api/userSubscriptionApi.js'
import { LabourPublicDetailSheet } from '../labour/LabourPublicDetailSheet.jsx'
import { enrichDiscoverLabourUi, DEMO_LABOUR_ROWS } from '../../../lib/discoverLabourDummyUi.js'
import { displayBookingsList, loadIndividualBookings } from '../../../lib/individualBookings.js'
import { buildBookingFlowPath } from '../../../lib/bookingFlowNavigation.js'

function formatBookingDay(serviceDate) {
  if (!serviceDate) return 'Soon'
  const d = new Date(serviceDate)
  if (Number.isNaN(d.getTime())) return 'Soon'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Home dashboard for homeowner / individual — premium image-first discovery.
 */
export function IndividualHomeScreen({ user }) {
  const navigate = useNavigate()

  const [tradeGroups, setTradeGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState(null)

  const [labours, setLabours] = useState([])
  const [laboursLoading, setLaboursLoading] = useState(true)
  const [laboursErr, setLaboursErr] = useState('')

  const [detailId, setDetailId] = useState(null)
  const [detailLabour, setDetailLabour] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [quickBookModeOpen, setQuickBookModeOpen] = useState(false)
  const [quickBookTypeOpen, setQuickBookTypeOpen] = useState(false)
  const [quickBookCategory, setQuickBookCategory] = useState(null)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookings, setBookings] = useState([])

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  const [activeSubscription, setActiveSubscription] = useState(null)
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false)

  const enrichedLabours = useMemo(() => {
    return labours.map((l) => ({ ...l, _ui: enrichDiscoverLabourUi(l) }))
  }, [labours])

  const nearbyLabours = useMemo(() => {
    const available = enrichedLabours.filter((l) =>
      String(l?._ui?.workHoursLabel || '').toLowerCase().includes('available'),
    )
    return (available.length ? available : enrichedLabours).slice(0, 5)
  }, [enrichedLabours])

  const sortedBookings = useMemo(() => {
    const items = Array.isArray(bookings) ? bookings : []
    return [...items].sort((a, b) => {
      const bTime = String(b?.updatedAt || b?.createdAt || '')
      const aTime = String(a?.updatedAt || a?.createdAt || '')
      return bTime.localeCompare(aTime)
    })
  }, [bookings])

  const ongoingBookings = useMemo(() => {
    const activeStatuses = ['CREATED', 'BROADCASTING', 'ACCEPTED', 'ASSIGNED', 'EN_ROUTE', 'STARTED']
    return sortedBookings.filter((b) => activeStatuses.includes(b?.status)).slice(0, 3)
  }, [sortedBookings])

  const recentBookings = useMemo(() => {
    return ongoingBookings.length ? ongoingBookings : sortedBookings.slice(0, 3)
  }, [ongoingBookings, sortedBookings])

  useEffect(() => {
    if (!quickBookTypeOpen && !quickBookModeOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [quickBookTypeOpen, quickBookModeOpen])

  const goSearch = useCallback(() => {
    navigate('/app/search')
  }, [navigate])

  const handleQuickBookCategory = useCallback((cat) => {
    navigate(`/app/sub-category/${cat._id}`, { state: { cat } })
  }, [navigate])

  const handleQuickBookMode = useCallback(
    (mode) => {
      setQuickBookModeOpen(false)
      if (mode === 'manual') {
        const cat = quickBookCategory
        setQuickBookCategory(null)
        if (cat) {
          navigate(
            `/app/discover/labours?categoryId=${encodeURIComponent(cat._id)}&groupId=${encodeURIComponent(cat.groupId || '')}&promptMode=1`,
          )
        }
      } else if (mode === 'smart') {
        setQuickBookTypeOpen(true)
      }
    },
    [navigate, quickBookCategory],
  )

  const handleQuickBookType = useCallback(
    (bookingType) => {
      if (!quickBookCategory) return
      const prev = readBookingDraft() || {}
      writeBookingDraft({
        ...prev,
        entryPoint: 'category',
        groupId: String(quickBookCategory.groupId || ''),
        groupName: quickBookCategory.groupName || '',
        categoryId: String(quickBookCategory._id),
        categoryName: quickBookCategory.name || '',
        bookingType,
        matchMode: 'smart',
        selectedWorkers: [],
      })
      setQuickBookTypeOpen(false)
      setQuickBookCategory(null)
      navigate(buildBookingFlowPath('details', { categoryId: quickBookCategory._id }))
    },
    [navigate, quickBookCategory],
  )

  useEffect(() => {
    let cancelled = false
    fetchLabourCategoriesGrouped()
      .then((res) => {
        if (cancelled) return
        const groups = res.data?.groups ?? []
        const meta = res.data?.meta ?? {}
        const tradeKind = meta.tradeKind ?? 'trade'
        setTradeGroups(groups.filter((g) => g.kind === tradeKind && (g.categories?.length ?? 0) > 0))
      })
      .catch(() => {
        if (!cancelled) setTradeGroups([])
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadLabours = useCallback(async () => {
    setLaboursErr('')
    setLaboursLoading(true)
    try {
      const res = await fetchDiscoverLabours({
        groupId: selectedGroupId || undefined,
        limit: 36,
      })
      setLabours(res.data?.items ?? [])
    } catch (e) {
      setLabours([])
      setLaboursErr(e instanceof ApiError ? e.message : 'Could not load workers.')
    } finally {
      setLaboursLoading(false)
    }
  }, [selectedGroupId, user])

  useEffect(() => {
    queueMicrotask(() => {
      void loadLabours()
    })
  }, [loadLabours])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('lc-individual-home-layout'))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setBookingsLoading(false)
      return
    }
    bookingsApi.getMyBookings()
      .then((res) => {
        if (!cancelled) {
          setBookings(res.data?.bookings || [])
          setBookingsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load bookings', err)
          setBookings([])
          setBookingsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    let cancelled = false
    if (!user) return
    userSubscriptionApi.getMySubscription()
      .then((res) => {
        if (!cancelled && res?.data?.subscription) {
          setActiveSubscription(res.data.subscription)
        }
      })
      .catch((err) => console.error('Failed to load active subscription', err))
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    let cancelled = false
    fetchAppMartProducts()
      .then((res) => {
        if (!cancelled) {
          setProducts((res?.data ?? res ?? []).slice(0, 3))
          setProductsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load products', err)
          setProducts([])
          setProductsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const openDetail = useCallback((id) => {
    setDetailId(id)
    setDetailLabour(null)
    setDetailLoading(true)

    fetchDiscoverLabour(id)
      .then((res) => {
        setDetailLabour(res.data?.labour ?? null)
      })
      .catch(() => {
        setDetailLabour(null)
      })
      .finally(() => {
        setDetailLoading(false)
      })
  }, [user])

  const closeDetail = useCallback(() => {
    setDetailId(null)
    setDetailLabour(null)
    setDetailLoading(false)
  }, [])

  return (
    <div
      className="-mx-4 flex flex-col pb-6"
      aria-label={user?.fullName ? `Home for ${user.fullName}` : 'Discover workers home'}
    >
      {/* 1. Header Background Extension with Text, Image, & Buttons */}
      <div className="bg-brand px-4 pb-8 pt-6 rounded-b-[2.5rem] relative z-0 flex flex-col min-h-[300px]">
        
        {/* Top area with Text & Image */}
        <div className="flex-1 flex items-start relative mt-4">
          <div className="w-[60%] relative z-10 text-white">
            <h2 className="text-[1.5rem] sm:text-[1.85rem] font-extrabold leading-[1.2] tracking-tight">
              Your trusted <br/> partner for 100+ <br/> expert services
            </h2>
          </div>
          
          <div className="absolute bottom-[-3rem] right-[1rem] w-[75%] h-[175%] pointer-events-none [mask-image:linear-gradient(to_left,black_85%,transparent)] z-0">
            <img 
              src="/assets/images/labour_chowck_hero_worker_final.png" 
              alt="LaborChowck Professional" 
              className="w-full h-full object-contain object-bottom object-right scale-110" 
            />
          </div>
        </div>

        {/* 2. Instant & Schedule Buttons (Now inside the green section) */}
        <div className="relative z-20 mx-1 grid grid-cols-2 gap-3 pt-12 pb-2">
          <button
            onClick={() => navigate('/app/search')}
            className="group relative flex flex-col items-start justify-start rounded-2xl bg-gradient-to-b from-white to-slate-50/90 p-4 min-h-[110px] border border-slate-200/90 shadow-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-md hover:border-brand/40 overflow-hidden"
            aria-label="Instant Booking"
          >
            <TypewriterText text="Instant" className="text-left text-[15px] font-extrabold uppercase tracking-wider text-slate-800 z-10" />
            <span className="text-[11px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded-sm mt-1 z-10">Book in 60s</span>
            
            <div className="absolute bottom-1 right-1 h-12 w-12 flex items-center justify-center opacity-90 group-hover:scale-110 transition-transform duration-300">
              <Lottie animationData={instantAnimation} loop={true} className="h-full w-full object-contain" />
            </div>
          </button>

          <button
            onClick={() => navigate('/app/search')}
            className="group relative flex flex-col items-start justify-start rounded-2xl bg-gradient-to-b from-white to-slate-50/90 p-4 min-h-[110px] border border-slate-200/90 shadow-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:shadow-md hover:border-brand/40 overflow-hidden"
            aria-label="Schedule Booking"
          >
            <TypewriterText text="Schedule" className="text-left text-[15px] font-extrabold uppercase tracking-wider text-slate-800 z-10" />
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm mt-1 z-10">Pick date/time</span>
            
            <div className="absolute bottom-1 right-1 h-12 w-12 flex items-center justify-center opacity-90 group-hover:scale-110 transition-transform duration-300">
              <Lottie animationData={scheduleAnimation} loop={true} className="h-full w-full object-contain" />
            </div>
          </button>
        </div>
      </div>

      <section className="lc-individual-home-sheet space-y-6 pt-4 relative z-10 px-4">

        {/* 3. Explore Services (with 'Find a skill' text button on the right) */}
        <IndividualHomeWorkerCarousel
          title="Explore services"
          workers={nearbyLabours}
          loading={laboursLoading}
          error={laboursErr}
          emptyAction="Find a skill"
          onSelectWorker={openDetail}
          onEmptyAction={goSearch}
        />

        {/* 4. Promotional Banner Carousel (Moved above All Categories) */}
        <div className="py-2">
          <IndividualHomeHeroCarousel onBook={goSearch} />
        </div>

        {/* 5. All Categories in Square Shape (Grid on screen, not horizontal) */}
        <IndividualHomeCategoryGrid
          groups={tradeGroups}
          loading={groupsLoading}
          onSelectCategory={(group) => navigate('/app/services')}
          title="All Categories"
          emptyAction="Find a skill"
          onEmptyAction={goSearch}
        />

        {/* 5. Active Plan (if subscribed) */}
        {activeSubscription && (() => {
          const planName = activeSubscription.snapshotPlanDetails?.name || activeSubscription.plan?.name
          const allowed = activeSubscription.snapshotPlanDetails?.allowedBookings || activeSubscription.plan?.allowedBookings || 1
          const used = activeSubscription.bookingsUsed || 0
          const progress = Math.min(100, Math.round((used / allowed) * 100))

          return (
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm shadow-brand/5 relative">
              <button 
                onClick={() => setShowSubscriptionDetails(!showSubscriptionDetails)}
                className="w-full flex items-center justify-between p-3.5 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Plan</div>
                    <div className="text-sm font-black leading-tight text-slate-900 line-clamp-1">{planName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-1">
                     <div className="text-sm font-black text-brand tracking-tighter">
                        {used}<span className="text-xs font-bold text-slate-300">/{allowed}</span>
                     </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${showSubscriptionDetails ? 'rotate-90' : ''}`} />
                </div>
              </button>
              
              <AnimatePresence>
                {showSubscriptionDetails && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bookings Used</span>
                        <span className="text-[10px] font-bold text-brand">{progress}%</span>
                      </div>
                      <div className="relative mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div 
                          className="absolute left-0 top-0 h-full rounded-full bg-brand transition-all duration-500 ease-out" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <button
                        onClick={() => navigate('/app/subscriptions')}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 border border-slate-100"
                      >
                        Manage Subscription
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })()}

        {/* 6. Recently Booked (if any) */}
        <IndividualHomeRecentlyBooked
          bookings={recentBookings}
          loading={bookingsLoading}
          formatDay={formatBookingDay}
        />

        {/* 7. Products Carousel */}
        <IndividualHomeProductCarousel
          products={products}
          loading={productsLoading}
        />

        {/* 8. Detailed Trade Group Services */}
        <IndividualHomeServiceSections
          tradeGroups={tradeGroups}
          loading={groupsLoading}
          onQuickBook={handleQuickBookCategory}
          onSelectGroup={setSelectedGroupId}
        />
      </section>

      <BookingModeSheet
        open={quickBookModeOpen}
        onClose={() => {
          setQuickBookModeOpen(false)
          setQuickBookCategory(null)
        }}
        value={null}
        categoryLabel={quickBookCategory?.name}
        onSelect={handleQuickBookMode}
      />

      <BookingTypeSheet
        open={quickBookTypeOpen}
        onClose={() => {
          setQuickBookTypeOpen(false)
          setQuickBookCategory(null)
        }}
        value={null}
        categoryLabel={quickBookCategory?.name}
        onSelect={handleQuickBookType}
      />

      <AnimatePresence>
        {detailId ? (
          <LabourPublicDetailSheet
            labour={detailLabour}
            loading={detailLoading}
            onClose={closeDetail}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

