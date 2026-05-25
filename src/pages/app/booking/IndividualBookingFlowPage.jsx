import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ImagePlus,
  IndianRupee,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
  Sparkles,
  Zap,
} from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppButton } from '../../../components/app-ui/buttons/AppButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppTextInput } from '../../../components/app-ui/inputs/AppTextInput.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { BookingFindingScreen } from '../../../components/app/booking/BookingFindingScreen.jsx'
import { BookingTypeSheet } from '../../../components/app/booking/BookingTypeSheet.jsx'
import { BookingStepProgress } from '../../../components/app/booking/BookingStepProgress.jsx'
import {
  BOOKING_JOB_TIMELINE,
  PAYMENT_METHODS,
  bookingPayloadFromDraft,
  createIndividualBookingRecord,
  durationKindLabel,
  durationKindToDays,
  estimateIndividualBooking,
  findBookingByRef,
  formatInr,
  loadIndividualBookings,
  saveIndividualBookings,
  todayISODate,
} from '../../../lib/individualBookings.js'
import {
  clearBookingDraft,
  patchBookingDraft,
  readBookingDraft,
  writeBookingDraft,
} from '../../../lib/individualBookingDraft.js'
import { readAppUserLocation, writeAppUserLocation } from '../../../lib/appUserLocationStorage.js'
import { useCreateRequestMutation } from '../../../store/api/workforceApi.js'
import { enrichDiscoverLabourUi } from '../../../lib/discoverLabourDummyUi.js'
import {
  APP_HOME_LOCATION,
  BOOKING_FLOW_PATH,
  buildBookingFlowPath,
} from '../../../lib/bookingFlowNavigation.js'

const TIME_SLOTS = ['9:00 AM – 12:00 PM', '12:00 PM – 3:00 PM', '3:00 PM – 6:00 PM', '6:00 PM – 9:00 PM']

function FlowHeader({ title, subtitle, onBack }) {
  return (
    <motion.div layout className="-mx-4 px-4 pb-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-800 shadow-sm transition hover:border-brand/35 hover:text-brand"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Booking</p>
          <h1 className="text-xl font-black tracking-tight text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
        </div>
      </div>
    </motion.div>
  )
}

function FieldLabel({ children, optional }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {children}
      {optional ? <span className="ml-1 font-normal normal-case text-slate-400">(optional)</span> : null}
    </label>
  )
}

export function IndividualBookingFlowPage() {
  const navigate = useNavigate()
  const [createRequest] = useCreateRequestMutation()
  const location = useLocation()
  const reduce = useReducedMotion()
  const [searchParams] = useSearchParams()
  const step = searchParams.get('step') || 'type'
  const refParam = searchParams.get('ref')?.trim() || ''
  const categoryIdParam = searchParams.get('categoryId')?.trim() || ''
  const groupIdParam = searchParams.get('groupId')?.trim() || ''

  const [draft, setDraft] = useState(() => readBookingDraft() || {})
  const [formError, setFormError] = useState('')
  const [typeSheetOpen, setTypeSheetOpen] = useState(false)
  const [activeBooking, setActiveBooking] = useState(null)
  const [noMatch, setNoMatch] = useState(false)
  const [imageFiles, setImageFiles] = useState([])

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
      ref: refParam || undefined,
    }),
    [categoryIdParam, draft.categoryId, draft.groupId, groupIdParam, refParam],
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
    if (!refParam || activeBooking) return
    const found = findBookingByRef(loadIndividualBookings(), refParam)
    if (found) queueMicrotask(() => setActiveBooking(found))
  }, [refParam, activeBooking])

  useEffect(() => {
    if (location.pathname !== BOOKING_FLOW_PATH) return
    if (refParam) return
    if (!draft.categoryId && !categoryIdParam && !['type'].includes(step)) {
      leaveFlow()
    }
  }, [categoryIdParam, draft.categoryId, leaveFlow, location.pathname, refParam, step])

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

  const estimate = useMemo(() => {
    const lines = [
      {
        quantity: Math.max(1, (draft.selectedWorkers || []).length || 1),
      },
    ]
    const days = durationKindToDays(draft.durationKind, draft.durationDays)
    return estimateIndividualBooking({ lines, durationDays: days })
  }, [draft.durationDays, draft.durationKind, draft.selectedWorkers])

  const pickLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        syncDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {},
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
    if (draft.matchMode === 'manual' && !(draft.selectedWorkers || []).length) {
      setFormError('Select at least one worker from the list first.')
      return false
    }
    setFormError('')
    return true
  }

  const confirmBooking = async () => {
    if (!validateDetails()) return
    writeAppUserLocation({ address: draft.address.trim(), lat: draft.lat, lng: draft.lng })
    const payload = bookingPayloadFromDraft({
      ...draft,
      imageNames: imageFiles.map((f) => f.name),
    })
    const record = createIndividualBookingRecord(payload)
    const stored = loadIndividualBookings()
    saveIndividualBookings([record, ...stored])

    try {
      await createRequest({
        lines: [{ categoryId: draft.categoryId, quantity: draft.workers || 1 }],
        startDate: draft.bookingType === 'scheduled' && draft.serviceDate ? draft.serviceDate : new Date().toISOString().slice(0, 10),
        locationText: draft.address.trim(),
        notes: payload.notes,
        bookingType: draft.bookingType,
        scheduleType: 'daily',
      }).unwrap()
    } catch {
      /* local history still saved; admin queue optional when offline */
    }

    setActiveBooking(record)
    patchBookingDraft({ lastRef: record.ref })
    goStep('searching')
  }

  const simulateAccept = useCallback(() => {
    if (!activeBooking) return
    const worker =
      draft.matchMode === 'smart'
        ? {
            id: 'smart-match',
            displayName: 'Matched worker',
            photoUrl: enrichDiscoverLabourUi({ id: 'smart', displayName: 'Raju S.' }).photoUrl,
            phone: '+91 98••• •••42',
          }
        : (draft.selectedWorkers || [])[0] || null

    const updated = {
      ...activeBooking,
      status: 'accepted',
      assignedWorker: worker,
      jobTimelineStep: 'accepted',
      etaMinutes: 22,
    }
    setActiveBooking(updated)
    const stored = loadIndividualBookings().map((b) => (b.id === updated.id ? updated : b))
    saveIndividualBookings(stored)
    goStep('active')
    setNoMatch(false)
  }, [activeBooking, draft.matchMode, draft.selectedWorkers, goStep])

  const handleFindingComplete = () => {
    simulateAccept()
  }

  const handleNoMatch = () => {
    setNoMatch(true)
  }

  const wizardIndex = step === 'type' ? 0 : step === 'details' ? 1 : step === 'summary' ? 2 : 3

  if (step === 'searching' && !noMatch) {
    return (
      <div className="pb-8">
        <FlowHeader title="Matching labour" subtitle="Hang tight — this usually takes a few seconds" onBack={() => goStep('summary')} />
        <BookingFindingScreen
          categoryLabel={draft.categoryName}
          onComplete={handleFindingComplete}
          onNoMatch={handleNoMatch}
        />
      </div>
    )
  }

  if (noMatch) {
    return (
      <div className="space-y-4 pb-8">
        <FlowHeader title="No one available yet" subtitle="Try widening your search" onBack={() => navigate('/app/discover/labours')} />
        <GlassPanel className="p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" aria-hidden />
          <p className="mt-3 text-sm font-bold text-slate-900">No labour accepted within 5 minutes</p>
          <p className="mt-2 text-xs text-slate-600">You can retry with smart match or pick workers manually.</p>
          <motion.div layout className="mt-5 flex flex-col gap-2">
            <AppPrimaryButton type="button" onClick={() => { setNoMatch(false); goStep('searching') }}>
              Retry search
            </AppPrimaryButton>
            <AppButton type="button" variant="secondary" onClick={() => navigate('/app/discover/labours')}>
              Change workers
            </AppButton>
          </motion.div>
        </GlassPanel>
      </div>
    )
  }

  if (step === 'active' || step === 'payment') {
    const booking = activeBooking
    const worker = booking?.assignedWorker || (draft.selectedWorkers || [])[0]
    const timelineIdx = BOOKING_JOB_TIMELINE.findIndex((t) => t.id === (booking?.jobTimelineStep || 'accepted'))

    return (
      <div className="space-y-4 pb-8">
        <FlowHeader
          title={step === 'payment' ? 'Payment' : 'Worker on the way'}
          subtitle={booking?.ref ? `Ref ${booking.ref}` : draft.categoryName}
          onBack={() => (step === 'payment' ? goStep('active') : navigate('/app/bookings', { replace: true }))}
        />

        {worker ? (
          <GlassPanel className="overflow-hidden border-slate-200/90 p-0">
            <motion.div layout className="flex gap-4 p-4">
              <img
                src={worker.photoUrl || enrichDiscoverLabourUi(worker).photoUrl}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-900">{worker.displayName}</p>
                <p className="text-xs font-semibold text-brand">ETA · {booking?.etaMinutes || 20} min</p>
                <p className="mt-1 text-[11px] text-slate-500">{draft.categoryName}</p>
              </div>
            </motion.div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/80 p-3">
              <a
                href={`tel:${(worker.phone || '+919876543210').replace(/\s/g, '')}`}
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

        <AppSurface>
          <p className="text-[11px] font-bold uppercase text-slate-400">Status</p>
          <ol className="mt-3 space-y-2">
            {BOOKING_JOB_TIMELINE.map((t, i) => {
              const done = i <= Math.max(0, timelineIdx)
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      done ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{t.label}</span>
                </li>
              )
            })}
          </ol>
        </AppSurface>

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
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                    draft.paymentTiming === opt.id
                      ? 'border-brand/40 bg-brand/8 ring-2 ring-brand/20'
                      : 'border-slate-200/90'
                  }`}
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
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                    draft.paymentMethod === m.id
                      ? 'border-brand/40 bg-brand/8 ring-2 ring-brand/20'
                      : 'border-slate-200/90'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </motion.div>
            <GlassPanel className="p-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatInr(estimate.estimatedSubtotal)}</span>
              </div>
              <motion.div layout className="mt-1 flex justify-between text-slate-500">
                <span>Platform fee</span>
                <span>{formatInr(estimate.platformFee)}</span>
              </motion.div>
              <div className="mt-1 flex justify-between text-slate-500">
                <span>Taxes (GST)</span>
                <span>{formatInr(estimate.gst)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-black text-brand">
                <span>Total</span>
                <span>{formatInr(estimate.grandTotal)}</span>
              </div>
            </GlassPanel>
            <AppPrimaryButton
              type="button"
              className="w-full py-3.5"
              onClick={() => {
                clearBookingDraft()
                navigate(`/app/bookings?ref=${encodeURIComponent(booking?.ref || '')}`)
              }}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Confirm payment
            </AppPrimaryButton>
          </motion.div>
        ) : (
          <div className="sticky bottom-2 z-10 pt-2">
            <AppPrimaryButton type="button" className="w-full py-3.5 shadow-xl" onClick={() => goStep('payment')}>
              <IndianRupee className="h-4 w-4" aria-hidden />
              Proceed to payment
            </AppPrimaryButton>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <FlowHeader
        title={
          step === 'type'
            ? 'Booking type'
            : step === 'details'
              ? 'Job details'
              : 'Review & confirm'
        }
        subtitle={draft.categoryName || 'Your booking'}
        onBack={() => {
          if (step === 'type') leaveFlow()
          else if (step === 'details') goStep('type')
          else goStep('details')
        }}
      />

      {step !== 'searching' ? (
        <AppSurface className="border-slate-200/90">
          <BookingStepProgress step={wizardIndex} total={3} />
        </AppSurface>
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
              <p className="text-sm font-bold text-slate-900">
                {draft.bookingType === 'scheduled' ? 'Schedule booking' : draft.bookingType === 'instant' ? 'Instant booking' : 'Choose booking type'}
              </p>
              <p className="text-xs text-slate-500">Tap to change</p>
            </span>
            <ArrowRight className="h-5 w-5 text-slate-300" aria-hidden />
          </button>
          <AppPrimaryButton
            type="button"
            className="w-full py-3.5"
            disabled={!draft.bookingType}
            onClick={() => goStep('details')}
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </AppPrimaryButton>
        </motion.div>
      ) : null}

      {step === 'details' ? (
        <motion.div layout className="space-y-4">
          {draft.matchMode === 'smart' && draft.categoryId ? (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/app/discover/labours?categoryId=${encodeURIComponent(draft.categoryId)}&groupId=${encodeURIComponent(draft.groupId || '')}&promptMode=1`,
                )
              }
              className="w-full rounded-2xl border border-dashed border-brand/35 bg-brand/5 py-2.5 text-xs font-bold text-brand"
            >
              Prefer to pick workers yourself? Browse list
            </button>
          ) : null}
          <div>
            <FieldLabel>Work location</FieldLabel>
            <AppTextInput
              value={draft.address || ''}
              onChange={(e) => syncDraft({ address: e.target.value })}
              placeholder="House, street, area, city"
              leftSlot={<MapPin className="h-4 w-4" aria-hidden />}
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 py-2.5 text-[11px] font-bold text-slate-700"
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
              className="w-full resize-none rounded-2xl border border-slate-200/90 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/25"
            />
          </motion.div>

          <motion.div layout>
            <FieldLabel optional>Photos</FieldLabel>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-4 text-xs font-bold text-slate-600">
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
                  className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    draft.durationKind === d.id
                      ? 'bg-brand text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80'
                  }`}
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
                className="mt-2 w-full rounded-2xl border border-slate-200/90 px-4 py-2.5 text-sm font-bold"
              />
            ) : null}
          </motion.div>

          {draft.bookingType === 'instant' ? (
            <GlassPanel className="flex items-center gap-2 border-brand/20 bg-brand/5 p-3">
              <Zap className="h-5 w-5 text-brand" aria-hidden />
              <div>
                <p className="text-sm font-bold text-slate-900">ASAP</p>
                <p className="text-xs text-slate-600">We&apos;ll match the earliest available slot</p>
              </div>
            </GlassPanel>
          ) : (
            <div className="space-y-3">
              <motion.div layout>
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  min={todayISODate()}
                  value={draft.serviceDate || ''}
                  onChange={(e) => syncDraft({ serviceDate: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200/90 px-4 py-3 text-sm font-semibold"
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
                      className={`rounded-xl border px-2 py-2.5 text-[11px] font-bold ${
                        draft.timeSlot === slot
                          ? 'border-brand/40 bg-brand/8 ring-2 ring-brand/20'
                          : 'border-slate-200/90'
                      }`}
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

          <AppPrimaryButton type="button" className="w-full py-3.5" onClick={() => (validateDetails() ? goStep('summary') : null)}>
            Review booking
            <ArrowRight className="h-4 w-4" aria-hidden />
          </AppPrimaryButton>
        </motion.div>
      ) : null}

      {step === 'summary' ? (
        <motion.div layout className="space-y-4">
          <GlassPanel className="space-y-3 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Service</span>
              <span className="text-right font-bold text-slate-900">
                {draft.groupName}
                <br />
                {draft.categoryName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Booking</span>
              <span className="font-bold capitalize">{draft.bookingType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">When</span>
              <span className="font-bold text-slate-900">
                {draft.bookingType === 'instant'
                  ? 'ASAP'
                  : `${draft.serviceDate} · ${draft.timeSlot}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration</span>
              <span className="font-bold">{durationKindLabel(draft.durationKind)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-slate-500">Workers</span>
              <span className="text-right font-bold">
                {draft.matchMode === 'smart'
                  ? 'Smart match'
                  : (draft.selectedWorkers || []).map((w) => w.displayName).join(', ') || '—'}
              </span>
            </div>
            <p className="flex items-start gap-2 text-slate-800">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
              {draft.address}
            </p>
            <div className="border-t border-slate-100 pt-3">
              <motion.div layout className="flex justify-between text-slate-600">
                <span>Estimated labour</span>
                <span>{formatInr(estimate.estimatedSubtotal)}</span>
              </motion.div>
              <div className="flex justify-between text-slate-500">
                <span>Platform fee</span>
                <span>{formatInr(estimate.platformFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Taxes</span>
                <span>{formatInr(estimate.gst)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-black text-brand">
                <span>Total</span>
                <span>{formatInr(estimate.grandTotal)}</span>
              </div>
            </div>
          </GlassPanel>

          <div className="flex gap-2">
            <AppButton type="button" variant="secondary" className="flex-1" onClick={() => goStep('details')}>
              Edit details
            </AppButton>
            <AppPrimaryButton type="button" className="flex-1 py-3.5" onClick={confirmBooking}>
              Confirm booking
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            </AppPrimaryButton>
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
  )
}
