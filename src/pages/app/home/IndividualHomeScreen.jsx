import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Headphones,
  LayoutGrid,
  Loader2,
  HardHat,
  MapPin,
  Wrench,
  PaintRoller,
  Hammer,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Search,
} from 'lucide-react'
import { fetchLabourCategoriesGrouped } from '../../../api/labourCategoriesApi.js'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { AppListSkeleton } from '../../../components/app-ui/feedback/AppListSkeleton.jsx'
import { AppSectionHeader } from '../../../components/app-ui/layout/AppSectionHeader.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppPressableLinkCard } from '../../../components/app/AppPressableLinkCard.jsx'
import { IndividualLabourSubcategoriesSection } from '../../../components/app/individual/IndividualLabourSubcategoriesSection.jsx'
import { flattenTradeSubcategories } from '../../../lib/labourCategoryDisplay.js'
import { CategoryPickBottomSheet } from '../../../components/app/booking/CategoryPickBottomSheet.jsx'
import { BookingTypeSheet } from '../../../components/app/booking/BookingTypeSheet.jsx'
import { writeBookingDraft, readBookingDraft } from '../../../lib/individualBookingDraft.js'
import { fetchDiscoverLabour, fetchDiscoverLabours } from '../../../api/discoverLaboursApi.js'
import { ApiError } from '../../../api/http.js'
import { LabourPublicDetailSheet } from '../labour/LabourPublicDetailSheet.jsx'
import { ConstructionIllustration } from '../../../components/landing/ConstructionIllustration.jsx'
import { enrichDiscoverLabourUi, hashSeed } from '../../../lib/discoverLabourDummyUi.js'
import {
  bookingStatusToUi,
  displayBookingsList,
  loadIndividualBookings,
} from '../../../lib/individualBookings.js'
import { buildBookingFlowPath } from '../../../lib/bookingFlowNavigation.js'

const TRADE_VISUAL_ICONS = [HardHat, Wrench, PaintRoller, Hammer, Sparkles]

const STEPS = [
  { icon: ClipboardList, title: 'Request', copy: 'Tell us what work you need' },
  { icon: Sparkles, title: 'Match', copy: 'We line up verified workers' },
  { icon: CheckCircle2, title: 'Relax', copy: 'Track status until they arrive' },
]

const TRUST_PILLS = [
  { icon: ShieldCheck, label: 'Aadhaar-verified' },
  { icon: Star, label: 'Clear rates' },
]

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

function availabilityFromWorkHours(workHoursLabel, responseLabel) {
  const s = String(workHoursLabel || '').toLowerCase()
  const r = String(responseLabel || '').toLowerCase()

  const available = s.includes('available') || s.includes('flexible') || s.includes('day wage') || s.includes('half-day')

  if (available) {
    return { label: 'Available Today', tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80', dot: 'bg-emerald-400' }
  }

  if (r.includes('within 30 min') || r.includes('same day') || r.includes('2 hrs')) {
    return { label: 'Likely today', tone: 'bg-sky-50 text-sky-900 ring-sky-200/80', dot: 'bg-sky-400' }
  }

  return { label: 'Limited slots', tone: 'bg-amber-50 text-amber-900 ring-amber-200/80', dot: 'bg-amber-400' }
}

function distanceLabelFor(labourId) {
  const n = hashSeed(String(labourId || 'x') + ':dist', 9) + 1 // 1..9
  return `${n} KM Away`
}

/**
 * Home dashboard for homeowner / individual accounts — discovery-first, Swiggy-style categories + workers.
 */
export function IndividualHomeScreen({ user }) {
  const reduce = useReducedMotion()
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
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [quickBookTypeOpen, setQuickBookTypeOpen] = useState(false)
  const [quickBookCategory, setQuickBookCategory] = useState(null)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookings, setBookings] = useState([])

  const enrichedLabours = useMemo(() => {
    return labours.map((l) => ({ ...l, _ui: enrichDiscoverLabourUi(l) }))
  }, [labours])

  const tradeSubcategories = useMemo(() => flattenTradeSubcategories(tradeGroups), [tradeGroups])

  const nearbyLabours = useMemo(() => {
    const available = enrichedLabours.filter((l) =>
      String(l?._ui?.workHoursLabel || '').toLowerCase().includes('available'),
    )
    return (available.length ? available : enrichedLabours).slice(0, 5)
  }, [enrichedLabours])

  const sortedBookings = useMemo(() => {
    const items = Array.isArray(bookings) ? bookings : []
    return [...items].sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
  }, [bookings])

  const ongoingBookings = useMemo(() => {
    return sortedBookings.filter((b) => String(b?.status).toLowerCase() === 'pending_review').slice(0, 2)
  }, [sortedBookings])

  const recentBookings = useMemo(() => {
    return ongoingBookings.length ? ongoingBookings : sortedBookings.slice(0, 2)
  }, [ongoingBookings, sortedBookings])

  const actions = useMemo(
    () => [
      {
        id: 'book',
        title: 'Book labour',
        subtitle: 'Search a skill and pick workers nearby',
        icon: Sparkles,
      },
      {
        id: 'history',
        to: '/app/bookings',
        title: 'My bookings',
        subtitle: 'Track status and rebook past jobs',
        icon: CalendarClock,
      },
    ],
    [],
  )

  useEffect(() => {
    if (!categorySheetOpen && !quickBookTypeOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [categorySheetOpen, quickBookTypeOpen])

  const handleQuickBookCategory = useCallback((cat) => {
    setQuickBookCategory(cat)
    setQuickBookTypeOpen(true)
  }, [])

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
  }, [selectedGroupId])

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
    const t = window.setTimeout(() => {
      if (cancelled) return
      const stored = loadIndividualBookings()
      setBookings(displayBookingsList(stored))
      setBookingsLoading(false)
    }, 420)

    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
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
  }, [])

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
      <section
        className="sticky z-10 isolate min-h-[30vh] w-full shrink-0 px-4 pb-10 pt-1 sm:min-h-[32vh]"
        style={{ top: 'var(--individual-home-sticky-top, 5.5rem)' }}
      >
        <div
          className="absolute inset-0 -z-10 rounded-b-[2.25rem]  "
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 rounded-b-[2.25rem] bg-[radial-gradient(90%_65%_at_85%_0%,rgba(255,255,255,0.22),transparent_55%)] opacity-90"
          aria-hidden
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-white"
        >
          <button
            type="button"
            onClick={() => setCategorySheetOpen(true)}
            className="mt-2 flex w-full items-center gap-3 rounded-full border-0 bg-white px-4 py-3.5 text-left shadow-[0_12px_32px_-14px_rgba(0,0,0,0.45)] transition active:scale-[0.99] hover:brightness-[1.02]"
            aria-label="Search by category"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0 flex-1 text-sm font-medium text-slate-500">
              Search electrician, plumber, mason…
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
          </button>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <h3 className="text-sm font-extrabold tracking-tight text-white drop-shadow">Browse by work area</h3>
              {groupsLoading ? <Loader2 className="h-4 w-4 animate-spin text-white/80" aria-hidden /> : null}
            </div>
            <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                className={`flex min-w-[4.85rem] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-2.5 pb-3 pt-3 transition active:scale-[0.98] ${
                  selectedGroupId == null
                    ? 'border-white/55 bg-white/20 shadow-lg shadow-black/10 ring-2 ring-white/50'
                    : 'border-white/25 bg-white/10 hover:bg-white/18'
                }`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25  ">
                  <LayoutGrid className="h-6 w-6 text-white" aria-hidden />
                </span>
                <span className="max-w-[4.85rem] text-center text-[10px] font-bold leading-tight text-white">All Categories</span>
              </button>
              {tradeGroups.map((g, idx) => {
                const gid = String(g._id)
                const active = selectedGroupId === gid
                const VisIcon = TRADE_VISUAL_ICONS[idx % TRADE_VISUAL_ICONS.length]
                return (
                  <button
                    key={gid}
                    type="button"
                    onClick={() => setSelectedGroupId(gid)}
                    className={`flex min-w-[4.85rem] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-2.5 pb-3 pt-3 transition active:scale-[0.98] ${
                      active
                        ? 'border-white/55 bg-white/20 shadow-lg shadow-black/10 ring-2 ring-white/50'
                        : 'border-white/25 bg-white/10 hover:bg-white/18'
                    }`}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 ">
                      <VisIcon className="h-6 w-6 text-white drop-shadow-sm" aria-hidden />
                    </span>
                    <span className="max-w-[4.85rem] text-center text-[10px] font-bold leading-tight text-white line-clamp-2">
                      {g.name}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 px-0.5 text-center text-[11px] font-medium text-white/75">
              Tap a tile to filter workers — same catalogue as when you book.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="relative z-20 -mt-6 flex-1 space-y-5 rounded-t-[1.85rem] bg-white px-4 pb-8 pt-5 shadow-[0_-14px_44px_-20px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/90">
        <span
          id="individual-home-scroll-sentinel"
          className="pointer-events-none absolute left-0 right-0 top-0 h-px w-full"
          aria-hidden
        />
        <IndividualLabourSubcategoriesSection
          subcategories={tradeSubcategories}
          loading={groupsLoading}
          onQuickBook={handleQuickBookCategory}
          onSelect={(cat) => {
            if (cat.groupId) setSelectedGroupId(String(cat.groupId))
          }}
        />

        {/* Nearby labour */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.08 }}
        className="space-y-2"
      >
        <div className="flex items-end justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900">Nearby Labour</h3>
            {/* <p className="mt-0.5 text-[11px] font-medium text-slate-500">Very important for trust.</p> */}
          </div>
          {laboursLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden /> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-0.5">
          {TRUST_PILLS.map(({ icon: Icon, label }) => (
            <motion.span
              key={label}
              initial={reduce ? undefined : { opacity: 0, y: 6 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.04 }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/12 text-brand">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              {label}
            </motion.span>
          ))}
        </div>

        {laboursErr ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900">
            {laboursErr}
          </p>
        ) : null}

        {!laboursLoading && !laboursErr && labours.length === 0 ? (
          <GlassPanel className="border-dashed border-slate-200/90 p-6 text-center">
            <UserRound className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-slate-800">No profiles in this filter yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Workers appear here once they pick work categories on LabourChowck. Try &quot;All&quot; or book and we&apos;ll match you manually.
            </p>
            <button
              type="button"
              onClick={() => setCategorySheetOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-bold text-white"
            >
              Find a skill
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </GlassPanel>
        ) : null}

        {laboursLoading ? <AppListSkeleton rows={4} /> : null}

        {!laboursLoading && !laboursErr && nearbyLabours.length > 0 ? (
          <ul className="space-y-2.5">
            {nearbyLabours.map((l) => {
              const ui = l._ui
              const firstCat = (l.tradeCategories || [])[0]
              const dist = distanceLabelFor(l.id)
              const { label: availLabel, tone: availTone, dot } = availabilityFromWorkHours(ui.workHoursLabel, ui.responseLabel)

              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(l.id)}
                    className="w-full text-left transition active:scale-[0.99]"
                  >
                    <motion.div
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.99 }}
                      transition={{ duration: 0.25 }}
                    >
                      <GlassPanel className="relative overflow-hidden border-slate-200/90 p-3.5 ring-1 ring-slate-100 transition hover:border-brand/25 hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
                            <img src={ui.photoUrl} alt="" className="h-full w-full object-cover object-top" loading="lazy" decoding="async" />
                            <span
                              aria-hidden
                              className={`absolute -right-2 -top-2 h-7 w-7 rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200/90`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-black tracking-tight text-slate-900">
                                  {l.displayName}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] font-bold text-slate-700">
                                  {firstCat?.name || 'Skilled worker'} • {ui.rating.toFixed(1)}
                                  <Star className="inline-block h-3.5 w-3.5 -translate-y-[1px] text-amber-400" aria-hidden />
                                </p>
                              </div>
                              {l.kycVerified ? (
                                <AppBadge variant="emerald" uppercase={false} className="shrink-0 text-[10px]">
                                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                                  Verified
                                </AppBadge>
                              ) : (
                                <AppBadge variant="neutral" uppercase={false} className="shrink-0 text-[10px]">
                                  Pending
                                </AppBadge>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200/70">
                                <MapPin className="h-3 w-3 text-brand" aria-hidden />
                                {dist}
                              </span>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black ring-1 ${availTone}`}
                              >
                                <span aria-hidden className={`h-2 w-2 rounded-full ${dot} animate-pulse`} />
                                {availLabel}
                              </span>
                            </div>

                            <div className="mt-2 truncate text-[11px] font-semibold text-slate-600">
                              Experience: {ui.experienceLabel}
                            </div>
                          </div>

                          <ChevronRight className="mt-1 h-5 w-5 shrink-0 self-center text-slate-300 transition group-hover:text-brand" aria-hidden />
                        </div>
                      </GlassPanel>
                    </motion.div>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </motion.section>

      {/* Ongoing / Recent Bookings — below nearby labour */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.02 }}
        className="space-y-3"
      >
        <div className="flex items-end justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900">Ongoing / Recent Bookings</h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Track or rebook your site requests</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/bookings')}
            className="shrink-0 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition hover:border-brand/35 hover:text-brand"
          >
            View All
          </button>
        </div>

        <Link
          to="/app/bookings"
          className="group flex items-center gap-3 rounded-2xl border border-brand/20 bg-linear-to-r from-brand/10 via-emerald-50/80 to-white p-3.5 ring-1 ring-brand/15 transition hover:ring-brand/35"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900">Need workers on site?</p>
            <p className="text-xs text-slate-600">Instant or scheduled booking with roles & site details</p>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-brand transition group-hover:translate-x-0.5" aria-hidden />
        </Link>

        {bookingsLoading ? <AppListSkeleton rows={2} /> : null}

        {!bookingsLoading && recentBookings.length ? (
          <motion.div className="space-y-2">
            {recentBookings.map((b, idx) => {
              const st = bookingStatusToUi(b.status)
              const primaryLine = (b.lines || [])[0]
              const itemLabel = primaryLine?.categoryName || (b.notes ? 'Service' : 'Labour')
              const qty = primaryLine?.quantity
              const day = formatBookingDay(b.serviceDate)
              const timeHint = b.bookingType === 'instant' ? 'Anytime' : 'Slot'
              const pending = String(b.status).toLowerCase() === 'pending_review'

              return (
                <motion.div
                  key={b.id || b.ref || idx}
                  initial={reduce ? undefined : { opacity: 0, y: 10 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: idx * 0.05 }}
                >
                  <GlassPanel className="p-4 ring-1 ring-slate-100 transition hover:border-brand/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-black text-brand ring-1 ring-brand/20">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                            {day} · {timeHint}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${st.tone}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-[14px] font-black text-slate-900">{itemLabel}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] font-medium text-slate-500">{b.address}</p>
                        {qty ? <p className="mt-1 text-[10px] font-semibold text-slate-600">Quantity: {qty}</p> : null}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/bookings?ref=${encodeURIComponent(b.ref || '')}`)}
                        className="flex-1 rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-brand/35 hover:text-brand"
                      >
                        Track
                      </button>
                      <motion.button
                        type="button"
                        onClick={() => navigate(`/app/bookings?rebookFrom=${encodeURIComponent(b.ref || '')}`)}
                        className="flex-1 rounded-2xl bg-brand px-3 py-2 text-sm font-extrabold text-white shadow-lg shadow-brand/25 transition hover:brightness-[1.06] active:scale-[0.99]"
                        whileHover={reduce ? undefined : { y: -2 }}
                        animate={
                          reduce
                            ? undefined
                            : pending
                              ? { y: [0, -3, 0] }
                              : undefined
                        }
                        transition={{ duration: 2.1 + idx * 0.08, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        Rebook
                      </motion.button>
                    </div>
                  </GlassPanel>
                </motion.div>
              )
            })}
          </motion.div>
        ) : null}

        {!bookingsLoading && !recentBookings.length ? (
          <GlassPanel className="border-dashed border-slate-200/90 p-6 text-center">
            <UserRound className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-slate-800">No bookings yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">When you book labour, your history will appear here.</p>
          </GlassPanel>
        ) : null}
      </motion.section>

      {/* Emergency Hiring Banner + BuildMart Promotion */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="space-y-3"
      >
        <div className="flex items-end justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900">Boost hiring</h3>
            {/* <p className="mt-0.5 text-[11px] font-medium text-slate-500">Swipe smart banners.</p> */}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Swipe</span>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {/* Emergency */}
          <motion.div
            className="relative min-w-[85%] overflow-hidden rounded-3xl border border-slate-800/30 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_48px_-28px_rgba(0,0,0,0.6)] snap-start"
            initial={reduce ? undefined : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />
              <div className="absolute -right-8 -bottom-10 w-[11rem] opacity-70">
                <ConstructionIllustration />
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ring-white/15">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Emergency
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black text-emerald-200 ring-1 ring-emerald-500/25">
                  <CalendarClock className="h-3 w-3" aria-hidden />
                  30 min match
                </span>
              </div>

              <h3 className="mt-3 text-lg font-extrabold tracking-tight">Need Labour Urgently?</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/80">Get workers within 30 minutes.</p>

              <div className="mt-4 flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={() => setCategorySheetOpen(true)}
                  className="relative inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-brand/30 transition hover:brightness-[1.06] active:scale-[0.99]"
                  whileHover={reduce ? undefined : { y: -2 }}
                  animate={reduce ? undefined : { y: [0, -4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Hire Now
                </motion.button>

                <span className="hidden text-[10px] font-semibold text-white/70 sm:inline">
                  Fast matching + verified workers
                </span>
              </div>
            </div>
          </motion.div>

          {/* BuildMart */}
          <motion.div
            className="relative min-w-[85%] overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-brand/15 via-white to-emerald-50 px-5 py-5 text-slate-900 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.15)] snap-start"
            initial={reduce ? undefined : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.02 }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-12 -top-12 h-[14rem] w-[14rem] rounded-full bg-brand/15 blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_0%,rgba(28,175,98,0.25),transparent_60%)]" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ring-brand/20">
                  Materials
                </span>
                <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[10px] font-black text-brand ring-1 ring-brand/20">
                  BuildMart
                </span>
              </div>

              <h3 className="mt-3 text-lg font-extrabold tracking-tight">Need Materials Too?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Order Cement, Sand &amp; Steel directly from nearby suppliers.
              </p>

              <div className="mt-4">
                <motion.button
                  type="button"
                  onClick={() => navigate('/app/buildmart')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-[1.06] active:scale-[0.99]"
                  whileHover={reduce ? undefined : { y: -2 }}
                  animate={reduce ? undefined : { y: [0, -3, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Explore BuildMart
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>


      {/* Quick actions */}
      <section className="space-y-3" aria-label="Quick actions">
        <AppSectionHeader className="px-0.5" title="Quick actions" />
        {actions.map((a, i) =>
          a.id === 'book' ? (
            <motion.button
              key={a.id}
              type="button"
              onClick={() => setCategorySheetOpen(true)}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.1 + i * 0.06 }}
              className="group w-full text-left"
            >
              <GlassPanel className="relative overflow-hidden p-4 transition hover:border-brand/30 active:scale-[0.985]">
                <motion.div layout className="flex items-start gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/20">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[15px] font-semibold text-slate-900">{a.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{a.subtitle}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-brand" aria-hidden />
                </motion.div>
              </GlassPanel>
            </motion.button>
          ) : (
            <AppPressableLinkCard key={a.id} to={a.to} title={a.title} subtitle={a.subtitle} icon={a.icon} delay={0.1 + i * 0.06} />
          ),
        )}
      </section>

      {/* How it works */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.12 }}
      >
        <AppSectionHeader className="mb-2 px-0.5" title="How it works" />
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {STEPS.map(({ icon: Icon, title, copy }, i) => (
            <GlassPanel
              key={title}
              className="min-w-38 shrink-0 snap-start border-slate-200/80 p-3 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/12 text-brand ring-1 ring-brand/15">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="mt-2 text-xs font-bold text-slate-900">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{copy}</p>
              <span className="mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                {i + 1}
              </span>
            </GlassPanel>
          ))}
        </div>
      </motion.section>

      {/* Trust */}
      <motion.section
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.35 }}
      >
        <AppSurface className="border-slate-200/80">
          <p className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Why homeowners choose us
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {TRUST_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/12 text-brand">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {label}
              </span>
            ))}
          </div>
        </AppSurface>
      </motion.section>
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.35 }}
        className="flex justify-center pb-1"
      >
        <Link
          to="/app/support"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-brand/30 hover:text-brand"
        >
          <Headphones className="h-4 w-4 text-brand" aria-hidden />
          Questions? Chat with support
        </Link>
      </motion.div>
      </section>

      <CategoryPickBottomSheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        tradeGroups={tradeGroups}
        groupsLoading={groupsLoading}
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
