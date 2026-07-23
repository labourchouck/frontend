import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Zap, CalendarClock } from 'lucide-react'
import { fetchLabourCategoriesGrouped } from '../../../api/labourCategoriesApi.js'
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
      className="-mx-4 flex flex-col pb-2"
      aria-label={user?.fullName ? `Home for ${user.fullName}` : 'Discover workers home'}
    >
      <div className="relative z-10 bg-brand px-4 pb-3">
        <IndividualHomeCategoryRail
          groups={tradeGroups}
          loading={groupsLoading}
          selectedGroupId={selectedGroupId}
          onSelectGroup={(id) => navigate(id ? `/app/search?groupId=${id}` : '/app/search')}
          onBrand
        />
      </div>

      <section className="lc-individual-home-sheet space-y-6">
        <IndividualHomeHeroCarousel onBook={goSearch} />

        <IndividualHomeRecentlyBooked
          bookings={recentBookings}
          loading={bookingsLoading}
          formatDay={formatBookingDay}
        />

        <div className="mx-4 flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => navigate('/app/search')}
            className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-[2rem] bg-emerald-500 py-3.5 shadow-[0_6px_0_#047857,_0_12px_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 active:translate-y-[4px] active:shadow-[0_2px_0_#047857,_0_6px_10px_rgba(16,185,129,0.3)]"
          >
            <Zap className="relative z-10 h-5 w-5 text-white transition-transform group-hover:scale-110" strokeWidth={2.5} />
            <span className="relative z-10 text-xs font-black uppercase tracking-wider text-white drop-shadow-md">Instant</span>
          </button>

          <button
            onClick={() => navigate('/app/search')}
            className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-[2rem] bg-slate-800 py-3.5 shadow-[0_6px_0_#0f172a,_0_12px_20px_rgba(15,23,42,0.3)] transition-all hover:bg-slate-700 active:translate-y-[4px] active:shadow-[0_2px_0_#0f172a,_0_6px_10px_rgba(15,23,42,0.3)]"
          >
            <CalendarClock className="relative z-10 h-5 w-5 text-white transition-transform group-hover:scale-110" strokeWidth={2.5} />
            <span className="relative z-10 text-xs font-black uppercase tracking-wider text-white drop-shadow-md">Schedule</span>
          </button>
        </div>

        <IndividualHomeWorkerCarousel
          title="Nearby labour"
          workers={nearbyLabours}
          loading={laboursLoading}
          error={laboursErr}
          emptyAction="Find a skill"
          onSelectWorker={openDetail}
          onEmptyAction={goSearch}
        />

        <IndividualHomeProductCarousel
          products={products}
          loading={productsLoading}
        />

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

