import { useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Star, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { useGetRequestQuery, useRateCorporateAssignmentMutation, useInitPaymentMutation, useVerifyPaymentMutation } from '../../../store/api/workforceApi.js'
import { SharedAttendanceDrawer } from '../../../components/shared/SharedAttendanceDrawer.jsx'
import { BookingReviewModal } from '../../../components/app/booking/BookingReviewModal.jsx'
import { useAuth } from '../../../hooks/useAuth.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CorporateRequestDetailPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const forcePayment = searchParams.get('payment') === 'true'
  const { data, isLoading, isError } = useGetRequestQuery(id, { skip: !id })
  const [initPayment, { isLoading: isInit }] = useInitPaymentMutation()
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyPaymentMutation()

  const [ratingState, setRatingState] = useState({ id: null, rating: 5, comment: '' })
  const [selectedAttendanceReqId, setSelectedAttendanceReqId] = useState(null)

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null)

  const [isInitializingRazorpay, setIsInitializingRazorpay] = useState(false)

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePay = async () => {
    try {
      setIsInitializingRazorpay(true)
      const isLoaded = await loadRazorpay()
      if (!isLoaded) {
        alert('Failed to load Razorpay SDK. Please check your connection.')
        setIsInitializingRazorpay(false)
        return
      }

      // Generate order
      const initRes = await initPayment({
        amount: Math.round(estimatedTotal),
        purpose: 'WORKFORCE_REQUEST',
        requestId: id,
      }).unwrap()

      // If keys are missing, backend creates a mock order. Bypass SDK to simulate success.
      if (initRes.order?.mock) {
        const verRes = await verifyPayment({
          razorpayOrderId: initRes.order.id,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'mock_signature_123',
        }).unwrap()

        setCreatedInvoiceId(verRes?.invoiceId)
        setShowReviewModal(true)
        setIsInitializingRazorpay(false)
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: initRes.order?.amount,
        currency: initRes.order?.currency,
        name: 'LaborChowk',
        description: `Payment for Request #${request?.reference}`,
        order_id: initRes.order?.id,
        handler: async function (response) {
          try {
            const verRes = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }).unwrap()

            setCreatedInvoiceId(verRes?.invoiceId)
            setShowReviewModal(true)
          } catch (err) {
            console.error('Payment Verification Failed', err)
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#059669' },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        console.error('Payment Failed', response.error)
        alert(response.error.description || 'Payment failed')
      })
      rzp.open()
      setIsInitializingRazorpay(false)
    } catch (err) {
      console.error(err)
      alert(err?.data?.message || err?.message || 'Payment initialization failed. Please try again.')
      setIsInitializingRazorpay(false)
    }
  }

  const request = data?.request
  const assignments = data?.assignments ?? []
  const platformFeeConfig = data?.platformFeeConfig

  const days = data?.pricingSummary?.days || (request ? Math.max(1, Math.ceil((new Date(request.endDate || request.startDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1) : 1)

  // Extract service breakdown or fallback
  const serviceBreakdown = data?.serviceBreakdown?.length
    ? data.serviceBreakdown
    : (request?.lines || []).map(line => {
      const servName = line.serviceName || line.categoryId?.name || line.categoryName || 'Specialist Labour'
      const catName = line.categoryName || line.categoryId?.name || ''
      const adminPrice = Number(line.adminPrice || line.categoryId?.adminPrice || 0)
      const qty = Number(line.quantity) || 1
      const totalPerDay = line.dailyTotal || (adminPrice * qty)
      const totalForDuration = line.durationTotal || (totalPerDay * days)
      return {
        serviceName: servName,
        categoryName: catName,
        quantity: qty,
        adminPricePerDay: adminPrice,
        totalPricePerDay: totalPerDay,
        totalPriceForDuration: totalForDuration,
        workers: []
      }
    })

  const basePriceTotal = data?.pricingSummary?.basePriceTotal ?? serviceBreakdown.reduce((sum, item) => sum + (item.totalPriceForDuration || (item.totalPricePerDay * days)), 0)
  const platformFee = data?.pricingSummary?.platformFee ?? (platformFeeConfig?.isActive ? (platformFeeConfig.type === 'fixed' ? platformFeeConfig.value : (basePriceTotal * platformFeeConfig.value) / 100) : 100)
  const estimatedTotal = data?.pricingSummary?.estimatedTotal ?? (basePriceTotal + platformFee)

  const handleRate = async (assignmentId) => {
    try {
      await rateAssignment({
        assignmentId,
        rating: ratingState.rating,
        comment: ratingState.comment
      }).unwrap()
      alert('Rating submitted successfully')
      setRatingState({ id: null, rating: 5, comment: '' })
    } catch (err) {
      console.error(err)
      alert('Failed to submit rating')
    }
  }

  if (isLoading) {
    return (
      <AppSurface>
        <p className="text-sm text-slate-500">Loading request…</p>
      </AppSurface>
    )
  }

  if (isError || !request) {
    return (
      <AppSurface className="border-rose-200/90">
        <p className="text-sm font-semibold text-rose-800">Request not found.</p>
        <Link to="/corporate/requests" className="mt-3 inline-block text-sm font-bold text-brand">
          Back
        </Link>
      </AppSurface>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <header className="sticky top-0 z-30 pt-3 mb-2">
        <GlassPanel className="flex items-center justify-between px-3 py-2.5">
          <Link to="/corporate/requests" className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand/80 transition-colors">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Requests
          </Link>
        </GlassPanel>
      </header>

      <AppSurface>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>

            <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">{request.reference}</h2>
            {data?.allocation?.vendorId && (
              <div className="mt-1 text-sm font-bold text-brand">
                Assigned Vendor: {data.allocation.vendorId.contractorProfile?.businessName || data.allocation.vendorId.fullName}
              </div>
            )}
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(request.startDate)}
              {request.endDate ? ` – ${formatDate(request.endDate)}` : ''} · <span className="font-semibold">{days} {days === 1 ? 'day' : 'days'}</span>
            </p>
            {request.shiftStart && (
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Time: {request.shiftStart}
              </p>
            )}
            {request.locationText ? <p className="mt-1 text-xs text-slate-500">{request.locationText}</p> : null}
            {request.billingMode && (
              <p className="mt-1 text-xs text-slate-500 font-medium">Billing Mode: <span className="uppercase">{request.billingMode.replace('_', ' ')}</span></p>
            )}
            {request.notes && (
              <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100"><span className="font-bold">Notes:</span> {request.notes}</p>
            )}
          </div>

          {user?.role === 'corporate' && (
            <Link
              to={`/corporate/attendance?date=${request.startDate ? new Date(request.startDate).toISOString().split('T')[0] : ''}`}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-brand text-white px-4 py-2.5 text-xs font-bold shadow-sm hover:bg-brand-600 transition-all shrink-0"
            >
              <Clock className="h-4 w-4" />
              Daily Attendance
            </Link>
          )}
        </div>
      </AppSurface>

      <PipelineTimeline status={request.status} />

      <AppSurface>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-900">Booked Services & Pricing</p>
          <span className="text-xs font-semibold text-slate-500">{days} {days === 1 ? 'day' : 'days'} duration</span>
        </div>

        <div className="mt-3 space-y-4">
          {serviceBreakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col text-sm border border-slate-100 bg-slate-50/30 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">{item.serviceName}</span>
                  {item.categoryName && item.categoryName !== item.serviceName && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-400">{item.categoryName}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-500">{item.labourers?.length || item.quantity} Labour(s)</span>
              </div>

              <div className="px-4 py-2 space-y-2">
                {(item.labourers || []).map((labour, lIdx) => (
                  <div key={lIdx} className="flex justify-between items-center text-xs text-slate-600">
                    <span>{labour.labourName}</span>
                    <span className="font-medium">₹{Math.round(labour.adminPrice).toLocaleString('en-IN')}/day</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Category Subtotal:</span>
                  <span className="font-medium">₹{Math.round(item.totalPricePerDay).toLocaleString('en-IN')}/day</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({item.gstPercentage || 0}%):</span>
                  <span className="font-medium">+ ₹{Math.round(item.gstAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-1.5 border-t border-slate-200/50 mt-0.5">
                  <span>Category Total (for {days} days):</span>
                  <span className="text-brand">₹{Math.round((item.totalPriceForDuration || (item.totalPricePerDay * days)) + (item.gstAmount || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Base Service Total ({days} {days === 1 ? 'day' : 'days'})</span>
            <span className="font-medium text-slate-800">₹{basePriceTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total Taxes (GST)</span>
            <span className="font-medium text-slate-800">₹{Math.round(data?.pricingSummary?.taxAmount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Platform Fee</span>
            <span className="font-medium text-slate-800">₹{Math.round(platformFee).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-extrabold text-slate-900 text-base pt-2 border-t border-slate-100">
            <span>Estimated Total</span>
            <span className="text-brand font-black text-lg">₹{Math.round(estimatedTotal).toLocaleString('en-IN')}</span>
          </div>

        </div>
      </AppSurface>

      {((['completed', 'billing'].includes(request.status) || forcePayment) && request.paymentStatus !== 'PAID') ? (
        <AppSurface className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-200/50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-black text-emerald-900">Work Completed</h3>
              </div>
              <p className="text-sm font-medium text-emerald-700 mt-2">
                All daily attendances have been finalized. Please proceed to payment to successfully close this workforce request.
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={isInitializingRazorpay || isInit}
              className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
            >
              {(isInitializingRazorpay || isInit || isVerifying) ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Make Payment'}
            </button>
          </div>
        </AppSurface>
      ) : (
        <AppSurface>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" aria-hidden />
              <p className="text-sm font-extrabold text-slate-900">Assigned roster</p>
            </div>
            {assignments.length > 0 && (
              <button
                onClick={() => setSelectedAttendanceReqId(request._id)}
                className="text-[10px] font-bold text-brand hover:text-white hover:bg-brand bg-brand/10 px-2.5 py-1 rounded-full transition-all duration-300"
              >
                View Attendance
              </button>
            )}
          </div>
          <div>
            {request.preferredCrewIds?.length > 0 && (
              <ul className="mt-3 space-y-3">
                {request.preferredCrewIds.map((crew) => {
                  const serv = crew.services?.[0]
                  const categoryName = crew.category || crew.categoryName || ''
                  const serviceName = serv?.name || crew.serviceName || categoryName || 'Labour'
                  const adminPrice = Number(crew.adminPrice ?? serv?.adminPrice ?? serv?.price ?? 0)

                  return (
                    <li key={crew._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{crew.fullName}</p>
                        </div>
                        {categoryName ? (
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{categoryName}</p>
                        ) : null}
                        {serviceName && serviceName !== categoryName ? (
                          <p className="text-xs text-slate-500 font-medium">{serviceName}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                          ₹{adminPrice.toLocaleString('en-IN')} / day
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </AppSurface>
      )}

      <SharedAttendanceDrawer
        requestId={selectedAttendanceReqId}
        onClose={() => setSelectedAttendanceReqId(null)}
      />

      <BookingReviewModal
        open={showReviewModal}
        bookingId={request?._id}
        revieweeId={data?.allocation?.vendorId?._id || request?.preferredVendorId?._id}
        workerName={data?.allocation?.vendorId?.contractorProfile?.businessName || request?.preferredVendorId?.contractorProfile?.businessName || data?.allocation?.vendorId?.fullName || request?.preferredVendorId?.fullName || 'Vendor'}
        onClose={() => navigate(createdInvoiceId ? `/corporate/billing/invoice/${createdInvoiceId}` : '/corporate/billing')}
        onSubmitted={() => navigate(createdInvoiceId ? `/corporate/billing/invoice/${createdInvoiceId}` : '/corporate/billing')}
      />
    </div>
  )
}
