import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  Zap,
} from 'lucide-react'
import { AppStackScreenHeader } from '../../../components/app/AppStackScreenHeader.jsx'
import { AppButton } from '../../../components/app-ui/buttons/AppButton.jsx'
import { AppTextInput } from '../../../components/app-ui/inputs/AppTextInput.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { fetchLabourCategoriesGrouped } from '../../../api/labourCategoriesApi.js'
import { bookingsApi } from '../../../api/bookingsApi.js'
import { uploadMedia, assetUrlFromUpload } from '../../../api/uploadApi.js'
import { BookingFindingScreen } from '../../../components/app/booking/BookingFindingScreen.jsx'
import { BookingTypeSheet } from '../../../components/app/booking/BookingTypeSheet.jsx'
import { BookingStepProgress } from '../../../components/app/booking/BookingStepProgress.jsx'
import { BookingServiceHighlight } from '../../../components/app/booking/BookingServiceHighlight.jsx'
import { BookingReviewModal } from '../../../components/app/booking/BookingReviewModal.jsx'
import { useBookingSocket } from '../../../hooks/useBookingSocket.js'
import { useAuth } from '../../../hooks/useAuth.js'
import {
  PAYMENT_METHODS,
  durationKindLabel,
  durationKindToDays,
  formatInr,
  todayISODate,
} from '../../../lib/individualBookings.js'
import {
  clearBookingDraft,
  patchBookingDraft,
  readBookingDraft,
  writeBookingDraft,
} from '../../../lib/individualBookingDraft.js'
import { readAppUserLocation, writeAppUserLocation } from '../../../lib/appUserLocationStorage.js'
import {
  APP_HOME_LOCATION,
  BOOKING_FLOW_PATH,
  buildBookingFlowPath,
} from '../../../lib/bookingFlowNavigation.js'

const TIME_SLOTS = ['9:00 AM – 12:00 PM', '12:00 PM – 3:00 PM', '3:00 PM – 6:00 PM', '6:00 PM – 9:00 PM']

function FieldLabel({ children, optional }) {
  return (
    <label className="lc-booking-flow-label">
      {children}
      {optional ? <span className="lc-booking-flow-muted font-normal"> (optional)</span> : null}
    </label>
  )
}

function BookingPrimaryButton({ children, className = '', ...rest }) {
  return (
    <button type="button" className={`lc-booking-btn-primary ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function IndividualBookingFlowPage() {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const [createRequest] = useCreateRequestMutation()
  const location = useLocation()
  const reduce = useReducedMotion()
  const [searchParams] = useSearchParams()
  const step = searchParams.get('step') || 'type'

  const categoryIdParam = searchParams.get('categoryId')?.trim() || ''
  const groupIdParam = searchParams.get('groupId')?.trim() || ''

  const [draft, setDraft] = useState(() => readBookingDraft() || {})
  const [formError, setFormError] = useState('')
  const [typeSheetOpen, setTypeSheetOpen] = useState(false)
  const [activeBookingId, setActiveBookingId] = useState(null)
  const [activeBooking, setActiveBooking] = useState(null)
  const [noMatch, setNoMatch] = useState(false)
  const [imageFiles, setImageFiles] = useState([])

  const [calculatedBill, setCalculatedBill] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const { bookingEvent } = useBookingSocket(activeBookingId)

  const syncDraft = useCallback((patch) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      writeBookingDraft(next)
      return next
    })
  }, [])

  const flowQuery = useCallback(
    () => ({
      categoryId: draft.categoryId || categoryIdParam,
      groupId: draft.groupId || groupIdParam,
    }),
    [categoryIdParam, draft.categoryId, draft.groupId, groupIdParam],
  )

  const goStep = useCallback(
    (nextStep) => {
      navigate(buildBookingFlowPath(nextStep, flowQuery()), { replace: true })
    },
    [flowQuery, navigate],
  )

  const leaveFlow = useCallback(() => {
    navigate(APP_HOME_LOCATION, { replace: true })
  }, [navigate])

  useEffect(() => {
    const stored = readBookingDraft()
    if (stored) queueMicrotask(() => setDraft(stored))
  }, [])

  useEffect(() => {
    if (!categoryIdParam && !groupIdParam) return
    const patch = {}
    if (categoryIdParam) patch.categoryId = categoryIdParam
    if (groupIdParam) patch.groupId = groupIdParam
    syncDraft(patch)
  }, [categoryIdParam, groupIdParam, syncDraft])

  useEffect(() => {
    if (!bookingEvent) return
    if (bookingEvent.type === 'BOOKING_ACCEPTED') {
      goStep('active')
      bookingsApi.getBookingStatus(activeBookingId).then(res => {
        if (res.data?.booking) setActiveBooking(res.data.booking)
      }).catch(err => console.error(err))
    } else if (bookingEvent.type === 'BOOKING_FAILED') {
      setNoMatch(true)
    } else if (bookingEvent.type === 'BOOKING_STATUS_UPDATE') {
      const newStatus = bookingEvent.data?.status
      setActiveBooking(prev => prev ? { ...prev, status: newStatus } : null)
      if (newStatus === 'COMPLETED') {
        // Refresh booking details then show review prompt
        bookingsApi.getBookingStatus(activeBookingId).then(res => {
          if (res.data?.booking) setActiveBooking(res.data.booking)
        }).catch(() => { })
        setReviewOpen(true)
      }
    }
  }, [bookingEvent, activeBookingId, goStep])

  useEffect(() => {
    const cid = categoryIdParam
    const gid = groupIdParam
    if (!cid) return

    const current = readBookingDraft()
    if (current?.categoryName && (!gid || current?.groupName)) return

    let cancelled = false
    fetchLabourCategoriesGrouped()
      .then((res) => {
        if (cancelled) return
        const groups = res.data?.groups ?? []
        for (const g of groups) {
          if (gid && String(g._id) !== gid) continue
          const cat = (g.categories || []).find((c) => String(c._id) === String(cid))
          if (cat) {
            const subcat = cat.subcategories?.[0]
            const srv = subcat?.services?.[0]
            syncDraft({
              categoryId: String(cat._id),
              serviceId: srv ? String(srv._id) : String(cat._id),
              categoryName: cat.name || '',
              groupId: String(g._id),
              groupName: g.name || '',
            })
            return
          }
        }
      })
      .catch(() => { })

    return () => {
      cancelled = true
    }
  }, [categoryIdParam, groupIdParam, syncDraft])

  useEffect(() => {
    if (location.pathname !== BOOKING_FLOW_PATH) return
    if (!draft.categoryId && !categoryIdParam && !['type'].includes(step)) {
      leaveFlow()
    }
  }, [categoryIdParam, draft.categoryId, leaveFlow, location.pathname, step])

  useEffect(() => {
    if (location.pathname !== BOOKING_FLOW_PATH) return
    if (step !== 'type' || !draft.bookingType) return
    if (draft.entryPoint !== 'category') return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      goStep('details')
    })
    return () => {
      cancelled = true
    }
  }, [draft.bookingType, draft.entryPoint, goStep, location.pathname, step])

  const pickLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        syncDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => { },
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }

  const applySavedAddress = () => {
    const saved = readAppUserLocation()
    if (saved?.address) syncDraft({ address: saved.address, lat: saved.lat, lng: saved.lng })
  }

  const validateDetails = () => {
    if (!draft.address?.trim()) {
      setFormError('Add your work location to continue.')
      return false
    }
    if (draft.bookingType === 'scheduled') {
      if (!draft.serviceDate) {
        setFormError('Choose a date for scheduled booking.')
        return false
      }
      if (draft.serviceDate < todayISODate()) {
        setFormError('Date cannot be in the past.')
        return false
      }
      if (!draft.timeSlot) {
        setFormError('Pick a time slot.')
        return false
      }
    }
    setFormError('')
    return true
  }

  const handleReviewBooking = async () => {
    if (!validateDetails()) return
    setIsCalculating(true)
    try {
      const days = durationKindToDays(draft.durationKind, draft.durationDays)
      const res = await bookingsApi.calculateBill({
        serviceId: draft.serviceId || draft.categoryId, // Fallback
        durationDays: days
      })
      setCalculatedBill(res.data)
      goStep('summary')
    } catch (err) {
      setFormError(err.message || 'Failed to calculate bill.')
    } finally {
      setIsCalculating(false)
    }
  }

  const confirmBooking = async () => {
    if (!validateDetails()) return
    if (isGuest) {
      navigate('/auth', { replace: true, state: { from: location.pathname + location.search } })
      return
    }
    writeAppUserLocation({ address: draft.address.trim(), lat: draft.lat, lng: draft.lng })

    try {
      const uploadedImageUrls = []
      for (const file of imageFiles) {
        const res = await uploadMedia(file, 'job-posters')
        const url = assetUrlFromUpload(res)
        if (url) uploadedImageUrls.push(url)
      }

      const days = durationKindToDays(draft.durationKind, draft.durationDays)
      const payload = {
        serviceId: draft.serviceId || draft.categoryId,
        type: draft.bookingType === 'scheduled' ? 'SCHEDULED' : 'INSTANT',
        locationText: draft.address.trim(),
        lat: draft.lat || 28.6139,
        lng: draft.lng || 77.2090,
        paymentMethod: draft.paymentMethod || 'CASH',
        notes: draft.notes,
        durationKind: draft.durationKind,
        durationDays: days,
        timeSlot: draft.timeSlot,
        scheduledAt: draft.serviceDate,
        imageNames: uploadedImageUrls,
      }

      const res = await bookingsApi.createBooking(payload)
      const createdBooking = res.data.booking
      setActiveBookingId(createdBooking._id)
      patchBookingDraft({ lastRef: createdBooking._id })
      setNoMatch(false)
      goStep('searching')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to create booking')
    } finally {
      setIsCreating(false)
    }
  }

  const wizardIndex = step === 'type' ? 0 : step === 'details' ? 1 : step === 'summary' ? 2 : 3

  if (step === 'searching' && !noMatch) {
    return (
      <div className="pb-8">
        <AppStackScreenHeader title="Matching labour" onBack={() => goStep('summary')} />
        <BookingServiceHighlight categoryName={draft.categoryName} groupName={draft.groupName} />
        <BookingFindingScreen
          categoryLabel={draft.categoryName}
          onComplete={() => { }}
          onNoMatch={() => { }}
        />
      </div>
    )
  }

  if (noMatch) {
    return (
      <div className="space-y-4 pb-8">
        <AppStackScreenHeader title="No match" onBack={() => navigate('/app/home')} />
        <GlassPanel className="p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" aria-hidden />
          <p className="mt-3 text-sm font-bold text-slate-900">Labourers are currently not available</p>
          <p className="mt-2 text-xs text-slate-600">Please try searching again in a few minutes.</p>
          <motion.div layout className="mt-5 flex flex-col gap-2">
            <BookingPrimaryButton type="button" onClick={() => { setNoMatch(false); confirmBooking() }}>
              Retry search
            </BookingPrimaryButton>
            <AppButton type="button" variant="secondary" onClick={() => navigate('/app/home')}>
              Cancel
            </AppButton>
          </motion.div>
        </GlassPanel>
      </div>
    )
  }

  if (step === 'active' || step === 'payment') {
    const booking = activeBooking
    const worker = booking?.laborId
    const statusSequence = ['CREATED', 'BROADCASTING', 'ACCEPTED', 'EN_ROUTE', 'STARTED', 'COMPLETED']
    const timelineIdx = booking ? statusSequence.indexOf(booking.status) - 2 : 0

    return (
      <div className="space-y-4 pb-8">
        <AppStackScreenHeader
          title={step === 'payment' ? 'Payment' : 'Worker on the way'}
          onBack={() => (step === 'payment' ? goStep('active') : navigate('/app/bookings', { replace: true }))}
        />
        <BookingServiceHighlight categoryName={draft.categoryName} groupName={draft.groupName} />

        {worker ? (
          <GlassPanel className="overflow-hidden border-slate-200/90 p-0">
            <motion.div layout className="flex gap-4 p-4">
              <img
                src={worker.profilePic || 'https://ui-avatars.com/api/?name=W'}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-900">{worker.name}</p>
                <p className="text-xs font-semibold text-brand">{worker.phone}</p>
                <p className="mt-1 text-[11px] text-slate-500">{draft.categoryName}</p>
              </div>
            </motion.div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/80 p-3">
              <a
                href={`tel:${worker.phone}`}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200/90"
              >
                <Phone className="h-4 w-4 text-brand" aria-hidden />
                Call
              </a>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200/90"
              >
                <MessageCircle className="h-4 w-4 text-brand" aria-hidden />
                Chat
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200/90"
              >
                <MapPinned className="h-4 w-4 text-brand" aria-hidden />
                Track
              </button>
            </div>
          </GlassPanel>
        ) : null}

        <div className="lc-booking-flow-card">
          <p className="lc-booking-flow-label">Status</p>
          <ol className="mt-3 space-y-2">
            {[
              { id: 'accepted', label: 'Accepted' },
              { id: 'en_route', label: 'En Route' },
              { id: 'started', label: 'Job Started' },
              { id: 'completed', label: 'Completed' },
            ].map((t, i) => {
              const done = i <= Math.max(0, timelineIdx)
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${done ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={`text-sm font-semibold ${done ? 'text-black' : 'text-black/40'}`}>{t.label}</span>
                </li>
              )
            })}
          </ol>
        </div>

        {booking && (
          <div className="lc-booking-flow-card">
            <p className="lc-booking-flow-label mb-2">Security OTPs</p>
            <div className="flex gap-4">
              <div className="flex-1 rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">Start OTP</p>
                <p className="text-xl font-black text-slate-800 tracking-widest">{booking.startOtp}</p>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">Completion OTP</p>
                <p className="text-xl font-black text-slate-800 tracking-widest">{booking.completionOtp}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' ? (
          <motion.div layout className="space-y-4">
            <FieldLabel>Pay now or after work</FieldLabel>
            <motion.div layout className="grid grid-cols-2 gap-2">
              {[
                { id: 'pay_now', label: 'Pay now' },
                { id: 'after_work', label: 'Pay after work' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => syncDraft({ paymentTiming: opt.id })}
                  className="lc-booking-slot"
                  data-active={draft.paymentTiming === opt.id ? 'true' : 'false'}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
            <FieldLabel>Payment method</FieldLabel>
            <motion.div layout className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => syncDraft({ paymentMethod: m.id })}
                  className="lc-booking-slot"
                  data-active={draft.paymentMethod === m.id ? 'true' : 'false'}
                >
                  {m.label}
                </button>
              ))}
            </motion.div>
            <div className="lc-booking-flow-card text-sm lc-booking-flow-body">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>{formatInr(booking?.basePrice || 0)}</span>
              </div>
              <div className="mt-1 flex justify-between lc-booking-flow-muted">
                <span>Platform fee</span>
                <span>{formatInr(booking?.platformFee || 0)}</span>
              </div>
              <div className="mt-1 flex justify-between lc-booking-flow-muted">
                <span>Taxes (GST)</span>
                <span>{formatInr(booking?.taxes || 0)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-black">
                <span>Total</span>
                <span>{formatInr(booking?.totalAmount || 0)}</span>
              </div>
            </div>
            <BookingPrimaryButton
              type="button"
              onClick={() => {
                clearBookingDraft()
                navigate(`/app/bookings`)
              }}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Confirm payment
            </BookingPrimaryButton>
          </motion.div>
        ) : (
          <div className="sticky bottom-2 z-10 space-y-2 pt-2">
            {activeBooking?.status === 'COMPLETED' ? (
              <BookingPrimaryButton type="button" onClick={() => setReviewOpen(true)}>
                <Star className="h-4 w-4" aria-hidden />
                Rate your experience
              </BookingPrimaryButton>
            ) : null}
            <BookingPrimaryButton type="button" onClick={() => goStep('payment')}>
              <IndianRupee className="h-4 w-4" aria-hidden />
              Proceed to payment
            </BookingPrimaryButton>
          </div>
        )}

        <BookingReviewModal
          open={reviewOpen}
          bookingId={activeBookingId}
          workerName={activeBooking?.laborId?.fullName || activeBooking?.laborId?.name || ''}
          onClose={() => setReviewOpen(false)}
          onSubmitted={() => {
            setReviewOpen(false)
            clearBookingDraft()
            navigate('/app/bookings', { replace: true })
          }}
        />
      </div>
    )
  }

  const flowTitle =
    step === 'type' ? 'Booking type' : step === 'details' ? 'Job details' : 'Review & confirm'

  return (
    <div className="-mx-4 space-y-4 bg-white pb-8">
      <AppStackScreenHeader
        title={flowTitle}
        onBack={() => {
          if (step === 'type') leaveFlow()
          else if (step === 'details') goStep('type')
          else goStep('details')
        }}
      />

      <div className="space-y-4 px-4">
        <BookingServiceHighlight categoryName={draft.categoryName} groupName={draft.groupName} />

        {step !== 'searching' ? (
          <div className="lc-booking-flow-card py-3">
            <BookingStepProgress step={wizardIndex} total={3} />
          </div>
        ) : null}

        {step === 'type' ? (
          <motion.div layout initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <button
              type="button"
              onClick={() => setTypeSheetOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                {draft.bookingType === 'scheduled' ? (
                  <Calendar className="h-5 w-5" aria-hidden />
                ) : (
                  <Zap className="h-5 w-5" aria-hidden />
                )}
              </span>
              <span className="flex-1">
                <p className="text-sm font-bold text-black">
                  {draft.bookingType === 'scheduled' ? 'Schedule booking' : draft.bookingType === 'instant' ? 'Instant booking' : 'Choose booking type'}
                </p>
                <p className="text-xs text-black/55">Tap to change</p>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden />
            </button>
            <BookingPrimaryButton type="button" disabled={!draft.bookingType} onClick={() => goStep('details')}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </BookingPrimaryButton>
          </motion.div>
        ) : null}

        {step === 'details' ? (
          <motion.div layout className="space-y-4">
            <div>
              <FieldLabel>Work location</FieldLabel>
              <AppTextInput
                value={draft.address || ''}
                onChange={(e) => syncDraft({ address: e.target.value })}
                placeholder="House, street, area, city"
                inputClassName="text-black font-semibold placeholder:text-black/40"
                leftSlot={<MapPin className="h-4 w-4 text-black/50" aria-hidden />}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={pickLocation}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-brand/25 bg-brand/5 py-2.5 text-[11px] font-bold text-brand"
                >
                  <Navigation className="h-3.5 w-3.5" aria-hidden />
                  Current location
                </button>
                <button
                  type="button"
                  onClick={applySavedAddress}
                  className="lc-booking-btn-secondary py-2.5 text-[11px]"
                >
                  Saved address
                </button>
              </div>
            </div>

            <motion.div layout>
              <FieldLabel optional>Work note</FieldLabel>
              <textarea
                value={draft.notes || ''}
                onChange={(e) => syncDraft({ notes: e.target.value })}
                rows={2}
                placeholder="Describe the work briefly…"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-black outline-none focus:border-brand focus:ring-0 placeholder:text-black/40"
              />
            </motion.div>

            <motion.div layout>
              <FieldLabel optional>Photos</FieldLabel>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-4 text-xs font-bold text-black">
                <ImagePlus className="h-4 w-4 text-brand" aria-hidden />
                Upload images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => setImageFiles([...(e.target.files || [])])}
                />
              </label>
              {imageFiles.length ? (
                <p className="mt-1 text-[11px] text-slate-500">{imageFiles.length} file(s) selected</p>
              ) : null}
            </motion.div>

            <motion.div layout>
              <FieldLabel>Working duration</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'few_hours', label: 'Few hours' },
                  { id: 'full_day', label: 'Full day' },
                  { id: 'multi_day', label: 'Multi day' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      syncDraft({
                        durationKind: d.id,
                        durationDays: durationKindToDays(d.id, draft.durationDays),
                      })
                    }
                    className="lc-booking-chip"
                    data-active={draft.durationKind === d.id ? 'true' : 'false'}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {draft.durationKind === 'multi_day' ? (
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={draft.durationDays || 2}
                  onChange={(e) => syncDraft({ durationDays: Number(e.target.value) || 2 })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-black"
                />
              ) : null}
            </motion.div>

            {draft.bookingType === 'instant' ? (
              <div className="lc-booking-highlight flex items-center gap-2">
                <Zap className="h-5 w-5 text-brand" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-black">ASAP</p>
                  <p className="text-xs font-medium text-black/70">Earliest available slot</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.div layout>
                  <FieldLabel>Date</FieldLabel>
                  <input
                    type="date"
                    min={todayISODate()}
                    value={draft.serviceDate || ''}
                    onChange={(e) => syncDraft({ serviceDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-black"
                  />
                </motion.div>
                <div>
                  <FieldLabel>Time slot</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => syncDraft({ timeSlot: slot })}
                        className="lc-booking-slot"
                        data-active={draft.timeSlot === slot ? 'true' : 'false'}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formError ? (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </p>
            ) : null}

            <BookingPrimaryButton type="button" onClick={handleReviewBooking} disabled={isCalculating}>
              {isCalculating ? 'Calculating...' : 'Review booking'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </BookingPrimaryButton>
          </motion.div>
        ) : null}

        {step === 'summary' && calculatedBill ? (
          <motion.div layout className="space-y-4">
            <div className="lc-booking-flow-card space-y-3 text-sm lc-booking-flow-body">
              <div className="flex justify-between gap-2">
                <span className="lc-booking-flow-muted">Service</span>
                <span className="text-right font-bold text-black">
                  <span className="lc-booking-highlight-title block text-base">{draft.categoryName}</span>
                  {draft.groupName ? <span className="text-xs font-semibold">{draft.groupName}</span> : null}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="lc-booking-flow-muted">Booking</span>
                <span className="font-bold capitalize text-black">{draft.bookingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="lc-booking-flow-muted">When</span>
                <span className="font-bold text-black">
                  {draft.bookingType === 'instant'
                    ? 'ASAP'
                    : `${draft.serviceDate} · ${draft.timeSlot}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="lc-booking-flow-muted">Duration</span>
                <span className="font-bold text-black">{durationKindLabel(draft.durationKind)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="shrink-0 lc-booking-flow-muted">Workers</span>
                <span className="text-right font-bold text-black">
                  Flash Broadcast Match
                </span>
              </div>
              <p className="flex items-start gap-2 font-medium text-black">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                {draft.address}
              </p>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between font-semibold text-black">
                  <span>Estimated labour</span>
                  <span>{formatInr(calculatedBill.basePrice)}</span>
                </div>
                <div className="mt-1 flex justify-between lc-booking-flow-muted">
                  <span>Platform fee</span>
                  <span>{formatInr(calculatedBill.platformFee)}</span>
                </div>
                <div className="flex justify-between lc-booking-flow-muted">
                  <span>Taxes</span>
                  <span>{formatInr(calculatedBill.taxes)}</span>
                </div>
                <div className="mt-2 flex justify-between text-base font-extrabold text-black">
                  <span>Total</span>
                  <span>{formatInr(calculatedBill.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" className="lc-booking-btn-secondary flex-1" onClick={() => goStep('details')}>
                Edit details
              </button>
              <BookingPrimaryButton type="button" className="flex-1" onClick={confirmBooking} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Confirm booking'}
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              </BookingPrimaryButton>
            </div>
          </motion.div>
        ) : null}

        <BookingTypeSheet
          open={typeSheetOpen}
          onClose={() => setTypeSheetOpen(false)}
          value={draft.bookingType}
          categoryLabel={draft.categoryName}
          onSelect={(id) => {
            syncDraft({ bookingType: id })
            setTypeSheetOpen(false)
          }}
        />
      </div>
    </div>
  )
}
