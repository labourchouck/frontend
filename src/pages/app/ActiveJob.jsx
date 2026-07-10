import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Play,
  X,
} from 'lucide-react'
import { bookingsApi } from '../../api/bookingsApi.js'
import { ApiError } from '../../api/http.js'
import { useSocket } from '../../context/SocketContext.jsx'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'

const STATUS_CONFIG = {
  ACCEPTED: {
    label: 'Start Journey',
    next: 'EN_ROUTE',
    icon: Navigation,
    color: 'bg-blue-600 shadow-blue-600/25',
    description: 'Let the customer know you\'re on your way',
  },
  EN_ROUTE: {
    label: 'Start Work',
    next: 'STARTED',
    icon: Play,
    color: 'bg-amber-600 shadow-amber-600/25',
    description: 'You\'ve arrived — begin the work',
  },
  STARTED: {
    label: 'Finish Job',
    next: 'COMPLETED',
    icon: CheckCircle2,
    color: 'bg-emerald-600 shadow-emerald-600/25',
    description: 'Mark the job as completed',
  },
}

const STEP_ORDER = ['ACCEPTED', 'EN_ROUTE', 'STARTED', 'COMPLETED']

export function ActiveJob() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()
  const reduce = useReducedMotion()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  // Fetch booking
  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    bookingsApi.getBookingStatus(bookingId)
      .then((res) => {
        if (cancelled) return
        setBooking(res.data?.booking || null)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load job')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [bookingId])

  // Socket updates
  useEffect(() => {
    if (!socket || !bookingId) return

    const handleStatusUpdate = (data) => {
      if (data.bookingId === bookingId) {
        setBooking((prev) => prev ? { ...prev, status: data.status } : prev)
      }
    }

    socket.on('BOOKING_STATUS_UPDATE', handleStatusUpdate)
    return () => { socket.off('BOOKING_STATUS_UPDATE', handleStatusUpdate) }
  }, [socket, bookingId])

  const handleStatusUpdate = useCallback(async (nextStatus) => {
    setUpdating(true)
    setUpdateError('')
    try {
      const res = await bookingsApi.updateBookingStatus(bookingId, nextStatus)
      setBooking((prev) => prev ? { ...prev, status: nextStatus } : prev)
      if (nextStatus === 'COMPLETED') {
        setTimeout(() => navigate('/app/my-bookings', { replace: true }), 1500)
      }
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }, [bookingId, navigate])

  const handleCancel = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure? A ₹50 penalty will be applied to your wallet.'
    )
    if (!confirmed) return

    setUpdating(true)
    setUpdateError('')
    try {
      await bookingsApi.updateBookingStatus(bookingId, 'CANCELLED')
      navigate('/app/my-bookings', { replace: true })
    } catch (err) {
      setUpdateError(err instanceof ApiError ? err.message : 'Failed to cancel')
      setUpdating(false)
    }
  }, [bookingId, navigate])

  if (loading) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Active Job" backTo="/app" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Active Job" backTo="/app" />
        <GlassPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{error || 'Job not found'}</p>
        </GlassPanel>
      </div>
    )
  }

  const status = (booking.status || 'ACCEPTED').toUpperCase()
  const config = STATUS_CONFIG[status]
  const stepIndex = STEP_ORDER.indexOf(status)
  const isCompleted = status === 'COMPLETED'
  const isCancelled = status === 'CANCELLED'
  const customer = booking.userId && typeof booking.userId === 'object' ? booking.userId : null

  return (
    <div className="space-y-4 pb-8">
      <AppStackScreenHeader title="Active Job" backTo="/app" />

      {/* Status Header */}
      <GlassPanel className={`border-brand/20 px-4 py-4 text-center ${isCompleted ? 'bg-emerald-50' : isCancelled ? 'bg-rose-50' : 'bg-brand/5'}`}>
        {isCompleted ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        ) : isCancelled ? (
          <X className="mx-auto h-12 w-12 text-rose-500" />
        ) : null}
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Status</p>
        <p className="text-xl font-extrabold text-slate-900">{status.replace('_', ' ')}</p>
      </GlassPanel>

      {/* Progress Steps */}
      <GlassPanel className="p-4">
        <div className="flex items-center justify-between">
          {STEP_ORDER.map((step, i) => {
            const done = i <= stepIndex
            return (
              <div key={step} className="flex items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    done ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`mx-1 h-0.5 w-6 sm:w-10 ${i < stepIndex ? 'bg-brand' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-500">
          <span>Accepted</span>
          <span>On Way</span>
          <span>Working</span>
          <span>Done</span>
        </div>
      </GlassPanel>

      {/* Customer Info */}
      {customer && (
        <GlassPanel className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-extrabold text-slate-900">{customer.name || 'Customer'}</p>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
                Call
              </a>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Booking Details */}
      <GlassPanel className="p-4 text-sm">
        {booking.totalAmount && (
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-slate-900">₹{booking.totalAmount}</span>
          </div>
        )}
        {booking.paymentMethod && (
          <div className="mt-2 flex justify-between">
            <span className="text-slate-500">Payment</span>
            <span className="font-bold text-slate-900">{booking.paymentMethod}</span>
          </div>
        )}
      </GlassPanel>

      {/* Error */}
      {updateError && (
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {updateError}
        </motion.p>
      )}

      {/* Action Button */}
      {config && !isCompleted && !isCancelled && (
        <div className="space-y-3">
          <button
            type="button"
            disabled={updating}
            onClick={() => handleStatusUpdate(config.next)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${config.color}`}
          >
            {updating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <config.icon className="h-5 w-5" aria-hidden />
                {config.label}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-500">{config.description}</p>
        </div>
      )}

      {/* Cancel Button */}
      {!isCompleted && !isCancelled && (
        <button
          type="button"
          disabled={updating}
          onClick={handleCancel}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 active:scale-[0.98] disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden />
          Cancel Job
        </button>
      )}
    </div>
  )
}
