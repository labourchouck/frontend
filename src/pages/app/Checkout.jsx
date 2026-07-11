import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  IndianRupee,
  Loader2,
  MapPin,
  Wallet,
} from 'lucide-react'
import { bookingsApi } from '../../api/bookingsApi.js'
import { paymentsApi } from '../../api/paymentsApi.js'
import { ApiError } from '../../api/http.js'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'

function formatInr(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isGuest } = useAuth()
  const reduce = useReducedMotion()
  const [searchParams] = useSearchParams()
  const subcategoryId = searchParams.get('subcategoryId') || ''
  const subcategoryName = searchParams.get('name') || 'Service'

  const [billLoading, setBillLoading] = useState(true)
  const [bill, setBill] = useState(null)
  const [billError, setBillError] = useState('')

  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Calculate bill on mount
  useEffect(() => {
    if (!subcategoryId) {
      setBillError('No subcategory selected')
      setBillLoading(false)
      return
    }
    let cancelled = false
    bookingsApi.calculateBill({ subcategoryId })
      .then((res) => {
        if (cancelled) return
        setBill(res.data || {})
      })
      .catch((err) => {
        if (!cancelled) setBillError(err instanceof ApiError ? err.message : 'Failed to calculate bill')
      })
      .finally(() => {
        if (!cancelled) setBillLoading(false)
      })
    return () => { cancelled = true }
  }, [subcategoryId])

  const handleSubmit = useCallback(async () => {
    if (isGuest) {
      navigate('/auth', { replace: true, state: { from: location.pathname + location.search } })
      return
    }
    if (!address.trim()) {
      setSubmitError('Please enter your work location')
      return
    }
    setSubmitError('')
    setSubmitting(true)

    try {
      const res = await bookingsApi.createBooking({
        subcategoryId,
        type: 'INSTANT',
        locationText: address.trim(),
        paymentMethod,
      })

      const booking = res.data?.booking
      if (!booking) throw new Error('Booking creation failed')

      if (paymentMethod === 'CASH') {
        navigate(`/app/tracking/${booking._id}`, { replace: true })
        return
      }

      // Online payment — Razorpay flow
      const razorpayLoaded = await loadRazorpay()
      if (!razorpayLoaded) {
        setSubmitError('Payment gateway failed to load. Please try again.')
        setSubmitting(false)
        return
      }

      const payRes = await paymentsApi.initPayment({
        amount: booking.totalAmount,
        purpose: 'BOOKING',
        bookingId: booking._id,
      })

      const order = payRes.data?.order
      if (!order) throw new Error('Payment initialization failed')

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.id,
        name: 'LabourChowk',
        description: `Booking: ${subcategoryName}`,
        handler: async function (response) {
          try {
            await paymentsApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            navigate(`/app/tracking/${booking._id}`, { replace: true })
          } catch (err) {
            setSubmitError('Payment verification failed. Contact support.')
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false)
          },
        },
        theme: { color: '#1caf62' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : err.message || 'Booking failed')
      setSubmitting(false)
    }
  }, [address, paymentMethod, subcategoryId, subcategoryName, navigate])

  return (
    <div className="space-y-4 pb-8">
      <AppStackScreenHeader title="Checkout" onBack={() => navigate(-1)} />

      {/* Service Header */}
      <GlassPanel className="border-brand/20 bg-brand/5 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">Service</p>
        <p className="mt-1 text-base font-extrabold text-slate-900">{subcategoryName}</p>
      </GlassPanel>

      {/* Bill Breakdown */}
      <GlassPanel className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill Breakdown</p>
        {billLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : billError ? (
          <p className="mt-2 text-sm font-semibold text-rose-700">{billError}</p>
        ) : bill ? (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Base Price</span>
              <span className="font-bold text-slate-900">{formatInr(bill.basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Platform Fee</span>
              <span className="font-bold text-slate-900">{formatInr(bill.platformFee)}</span>
            </div>
            {bill.taxes != null && (
              <div className="flex justify-between">
                <span className="text-slate-600">Taxes (GST)</span>
                <span className="font-bold text-slate-900">{formatInr(bill.taxes)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-extrabold text-slate-900">Total</span>
              <span className="font-extrabold text-brand">{formatInr(bill.totalAmount)}</span>
            </div>
          </div>
        ) : null}
      </GlassPanel>

      {/* Address */}
      <GlassPanel className="p-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          Work Location
        </label>
        <input
          type="text"
          className={inputClass + ' mt-2'}
          placeholder="House, street, area, city"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </GlassPanel>

      {/* Payment Method */}
      <GlassPanel className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Method</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('CASH')}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
              paymentMethod === 'CASH'
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Wallet className="h-4 w-4" aria-hidden />
            Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('ONLINE')}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
              paymentMethod === 'ONLINE'
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            Pay Online
          </button>
        </div>
      </GlassPanel>

      {/* Error */}
      {submitError && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {submitError}
        </motion.p>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={submitting || billLoading || !bill}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-brand/25 transition hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <IndianRupee className="h-5 w-5" aria-hidden />
            {paymentMethod === 'ONLINE' ? 'Pay & Book' : 'Confirm Booking'}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </>
        )}
      </button>
    </div>
  )
}
