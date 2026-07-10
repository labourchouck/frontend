import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Star,
  User,
} from 'lucide-react'
import { bookingsApi } from '../../api/bookingsApi.js'
import { ApiError } from '../../api/http.js'
import { useSocket } from '../../context/SocketContext.jsx'
import { setActiveBooking, updateBookingStatus as updateBookingStatusAction, clearActiveBooking } from '../../store/slices/activeBookingSlice.js'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { ReviewModal } from '../../components/app/ReviewModal.jsx'

const BOOKING_STEPS = [
  { id: 'CREATED', label: 'Booking Created' },
  { id: 'ACCEPTED', label: 'Labour Accepted' },
  { id: 'EN_ROUTE', label: 'On the Way' },
  { id: 'STARTED', label: 'Work Started' },
  { id: 'COMPLETED', label: 'Completed' },
]

export function JobTracking() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const socket = useSocket()
  const reduce = useReducedMotion()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReview, setShowReview] = useState(false)

  // Fetch booking on mount
  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    bookingsApi.getBookingStatus(bookingId)
      .then((res) => {
        if (cancelled) return
        const b = res.data?.booking
        if (b) {
          setBooking(b)
          dispatch(setActiveBooking({ bookingId: b._id, status: b.status }))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load booking')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [bookingId, dispatch])

  // Socket event listeners
  useEffect(() => {
    if (!socket || !bookingId) return

    const handleAccepted = (data) => {
      if (data.bookingId === bookingId) {
        setBooking((prev) => prev ? { ...prev, status: 'ACCEPTED', laborId: data.laborId } : prev)
        dispatch(updateBookingStatusAction('ACCEPTED'))
        // Refetch to get labor details
        bookingsApi.getBookingStatus(bookingId)
          .then((res) => {
            const b = res.data?.booking
            if (b) setBooking(b)
          })
          .catch(() => {})
      }
    }

    const handleStatusUpdate = (data) => {
      if (data.bookingId === bookingId) {
        setBooking((prev) => prev ? { ...prev, status: data.status } : prev)
        dispatch(updateBookingStatusAction(data.status))
        if (data.status === 'COMPLETED') {
          setShowReview(true)
        }
      }
    }

    socket.on('BOOKING_ACCEPTED', handleAccepted)
    socket.on('BOOKING_STATUS_UPDATE', handleStatusUpdate)

    return () => {
      socket.off('BOOKING_ACCEPTED', handleAccepted)
      socket.off('BOOKING_STATUS_UPDATE', handleStatusUpdate)
    }
  }, [socket, bookingId, dispatch])

  const currentStepIndex = useMemo(() => {
    if (!booking) return 0
    const idx = BOOKING_STEPS.findIndex((s) => s.id === booking.status)
    return idx >= 0 ? idx : 0
  }, [booking])

  const handleReviewClose = useCallback(() => {
    setShowReview(false)
    dispatch(clearActiveBooking())
    navigate('/app/my-bookings', { replace: true })
  }, [dispatch, navigate])

  if (loading) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Tracking" backTo="/app" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Tracking" backTo="/app" />
        <GlassPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{error || 'Booking not found'}</p>
        </GlassPanel>
      </div>
    )
  }

  const labor = booking.laborId && typeof booking.laborId === 'object' ? booking.laborId : null

  return (
    <div className="space-y-4 pb-8">
      <AppStackScreenHeader title="Job Tracking" backTo="/app" />

      {/* Status Badge */}
      <GlassPanel className="border-brand/20 bg-brand/5 px-4 py-3 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">Current Status</p>
        <p className="mt-1 text-lg font-extrabold text-slate-900">
          {BOOKING_STEPS[currentStepIndex]?.label || booking.status}
        </p>
      </GlassPanel>

      {/* Progress Stepper */}
      <GlassPanel className="p-5">
        <ol className="space-y-3">
          {BOOKING_STEPS.map((step, i) => {
            const done = i <= currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <motion.li
                key={step.id}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm transition ${
                    done
                      ? 'bg-brand text-white shadow-brand/30'
                      : 'bg-slate-100 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-brand/20' : ''}`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                    Active
                  </span>
                )}
              </motion.li>
            )
          })}
        </ol>
      </GlassPanel>

      {/* Laborer Details */}
      {labor && (
        <GlassPanel className="overflow-hidden p-0">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Labour</p>
          </div>
          <div className="flex items-center gap-4 p-4">
            {labor.profilePic ? (
              <img src={labor.profilePic} alt="" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <User className="h-7 w-7" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold text-slate-900">{labor.name || 'Labour'}</p>
              {labor.phone && (
                <a href={`tel:${labor.phone}`} className="mt-1 flex items-center gap-1 text-sm font-semibold text-brand">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {labor.phone}
                </a>
              )}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Booking Info */}
      <GlassPanel className="p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Booking ID</span>
          <span className="font-mono font-bold text-slate-900">{booking._id?.slice(-8) || bookingId}</span>
        </div>
        {booking.totalAmount && (
          <div className="mt-2 flex justify-between">
            <span className="text-slate-500">Total Amount</span>
            <span className="font-bold text-brand">₹{booking.totalAmount}</span>
          </div>
        )}
        {booking.paymentMethod && (
          <div className="mt-2 flex justify-between">
            <span className="text-slate-500">Payment</span>
            <span className="font-bold text-slate-900">{booking.paymentMethod}</span>
          </div>
        )}
      </GlassPanel>

      {/* Review Modal */}
      <ReviewModal
        open={showReview}
        bookingId={bookingId}
        onClose={handleReviewClose}
      />
    </div>
  )
}
