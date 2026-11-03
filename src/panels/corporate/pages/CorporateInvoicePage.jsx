import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Download, Printer } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { 
  useGetCorporateInvoicesQuery,
  useInitPaymentMutation,
  useVerifyPaymentMutation,
  useGetRequestQuery
} from '../../../store/api/workforceApi.js'
import { BookingReviewModal } from '../../../components/app/booking/BookingReviewModal.jsx'
import { pickRazorpayKey } from '../../../lib/razorpayKey.js'

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

function formatMoney(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function formatDay(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

export function CorporateInvoicePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showReviewModal, setShowReviewModal] = useState(false)
  
  const { data: invoicesData, isLoading: invLoading } = useGetCorporateInvoicesQuery()
  const [initPayment, { isLoading: isInitLoading }] = useInitPaymentMutation()
  const [verifyPayment, { isLoading: isVerifyLoading }] = useVerifyPaymentMutation()

  const invoices = invoicesData?.invoices ?? []
  const invoice = invoices.find(inv => inv._id === id)

  const reqId = invoice?.requestId?._id || invoice?.requestId
  const { data: reqData } = useGetRequestQuery(reqId, { skip: !reqId })
  
  const platformFeeConfig = reqData?.platformFeeConfig

  const isPaying = isInitLoading || isVerifyLoading

  const handlePay = async () => {
    if (!invoice) return
    try {
      const initRes = await initPayment({
        amount: invoice.totalAmount || invoice.total,
        purpose: 'INVOICE',
        invoiceId: invoice._id
      }).unwrap()

      const order = initRes?.order
      if (!order) throw new Error('Payment initialization failed')

      const finishPayment = async (payload) => {
        await verifyPayment(payload).unwrap()
        // Remove review=true from URL if present to avoid reopening on refresh
        setSearchParams({})
        setShowReviewModal(true)
      }

      // No Razorpay keys on the server: backend returns a mock order, so skip the SDK.
      if (order.mock) {
        await finishPayment({
          razorpayOrderId: order.id,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'mock_signature_123',
        })
        return
      }

      const loaded = await loadRazorpay()
      if (!loaded) {
        alert('Failed to load Razorpay SDK. Please check your connection.')
        return
      }

      const rzp = new window.Razorpay({
        key: pickRazorpayKey(initRes?.keyId),
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Mappto',
        description: `Invoice payment`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await finishPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
          } catch (err) {
            console.error('Payment verification failed', err)
            alert('Payment verification failed. Contact support.')
          }
        },
        theme: { color: '#2bb972' },
      })
      rzp.on('payment.failed', (response) => alert(response.error?.description || 'Payment failed'))
      rzp.open()
    } catch (err) {
      console.error('Payment failed', err)
      alert('Payment failed. Please try again.')
    }
  }

  if (invLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Invoice not found</h2>
        <p className="mt-2 text-sm text-slate-500">The invoice you are looking for does not exist or you don't have access.</p>
        <button onClick={() => navigate('/corporate/billing')} className="mt-4 text-brand font-medium">
          &larr; Back to Billing
        </button>
      </div>
    )
  }

  // Calculate live base cost based on service breakdown from booking ID
  const request = reqData?.request || invoice.requestId
  const days = reqData?.pricingSummary?.days || (request ? Math.max(1, Math.ceil((new Date(request.endDate || request.startDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1) : 1)
  
  const serviceBreakdown = reqData?.serviceBreakdown?.length
    ? reqData.serviceBreakdown
    : (request?.lines || []).map(line => {
      const servName = line.serviceName || line.categoryId?.name || line.categoryName || 'Labour'
      const adminPrice = Number(line.adminPrice || 0)
      const qty = Number(line.quantity) || 1
      return {
        serviceName: servName,
        quantity: qty,
        adminPricePerDay: adminPrice,
        totalPriceForDuration: (adminPrice * qty * days)
      }
    })

  const baseBookingAmount = serviceBreakdown.reduce((sum, item) => sum + item.totalPriceForDuration, 0)
  
  // Calculate live platform fee based on admin config
  let livePlatformFee = 0
  if (platformFeeConfig?.isActive) {
    if (platformFeeConfig.type === 'fixed') {
      livePlatformFee = platformFeeConfig.value
    } else {
      livePlatformFee = (baseBookingAmount * platformFeeConfig.value) / 100
    }
  } else {
    livePlatformFee = invoice.requestId?.platformFee ?? invoice.platformFee ?? ((invoice.totalAmount || invoice.total || 0) * 0.05)
  }

  const liveGst = reqData?.pricingSummary?.taxAmount || 0

  const liveTotal = baseBookingAmount + livePlatformFee + liveGst
  const isPaid = invoice.status?.toLowerCase() === 'paid'

  // One row per worker when the breakdown has them, otherwise one row per service group.
  const lineItems = serviceBreakdown.flatMap((item) => {
    if (item.labourers?.length) {
      return item.labourers.map((crew) => ({
        title: crew.labourName || item.serviceName,
        sub: item.serviceName,
        rate: Math.round(crew.adminPrice || 0),
        days,
        amount: Math.round((crew.adminPrice || 0) * days),
      }))
    }
    const qty = Number(item.quantity) || 1
    return [{
      title: item.serviceName,
      sub: qty > 1 ? `${qty} workers` : '',
      rate: Math.round((item.adminPricePerDay || 0) / qty),
      days,
      amount: Math.round(item.totalPriceForDuration || 0),
    }]
  })

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 pb-12 print:m-0 print:space-y-0 print:p-0">
      <header className="sticky top-0 z-30 -mx-4 mb-6 bg-white px-4 pb-1 pt-[max(0.75rem,env(safe-area-inset-top,0px))] print:hidden">
        <GlassPanel className="flex items-center justify-between px-3 py-2.5">
          <button 
            onClick={() => navigate('/corporate/billing')}
            className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> <span className="truncate">Back<span className="hidden sm:inline"> to Billing</span></span>
          </button>
          <div className="flex shrink-0 gap-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-[11px] font-bold text-brand bg-brand/10 hover:bg-brand/20 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </GlassPanel>
      </header>

      <div className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm print:rounded-none print:border-none print:shadow-none">
        {/* Letterhead */}
        <div className="flex items-start justify-between gap-4 border-b-4 border-brand px-5 pb-5 pt-6 sm:px-10 sm:pt-8 print:px-0">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.svg" alt="Mappto" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="text-lg font-black leading-tight tracking-tight text-slate-900">Mappto</p>
              <p className="text-[11px] font-medium leading-snug text-slate-500">Workforce &amp; services platform<br />support@mappto.com</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <h1 className="text-xl font-black uppercase tracking-[0.18em] text-slate-900 sm:text-3xl">Invoice</h1>
            <span className={`mt-1.5 inline-block rounded border-2 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest ${
              isPaid ? 'border-emerald-600 text-emerald-700' : 'border-amber-500 text-amber-700'
            }`}>
              {isPaid ? 'Paid' : invoice.status}
            </span>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-10 sm:py-8 print:px-0">
          {/* Invoice meta */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md bg-slate-50 p-4 text-sm sm:grid-cols-4 print:bg-transparent print:p-0">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoice No.</dt>
              <dd className="mt-0.5 break-all font-extrabold text-slate-900">{invoice.invoiceNumber || 'INV-000000'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issue date</dt>
              <dd className="mt-0.5 font-bold text-slate-900">{formatDay(invoice.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Booking ref.</dt>
              <dd className="mt-0.5 break-all font-bold text-slate-900">{request?.reference || '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service period</dt>
              <dd className="mt-0.5 font-bold text-slate-900">
                {request?.startDate ? formatDay(request.startDate) : '—'}
                {request?.endDate && formatDay(request.endDate) !== formatDay(request.startDate) ? ` – ${formatDay(request.endDate)}` : ''}
                <span className="block text-[11px] font-medium text-slate-500">{days} {days === 1 ? 'day' : 'days'}</span>
              </dd>
            </div>
          </dl>

          {/* Parties */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Billed to</p>
              <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                {invoice.corporateId?.corporateProfile?.companyName || invoice.corporateId?.corporateProfile?.businessName || invoice.corporateId?.fullName || 'Corporate Client'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {invoice.corporateId?.fullName ? <>Attn: {invoice.corporateId.fullName}<br /></> : null}
                {invoice.corporateId?.email ? <>{invoice.corporateId.email}<br /></> : null}
                {invoice.corporateId?.phone ? <>{invoice.corporateId.phone}<br /></> : null}
                {invoice.projectId?.name ? <>Project: {invoice.projectId.name}</> : null}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Service provided by</p>
              <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                {request?.preferredVendorId?.contractorProfile?.businessName || (request?.preferredVendorId ? 'Independent Vendor' : 'Mappto Platform')}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {request?.preferredVendorId?.fullName ? <>{request.preferredVendorId.fullName}<br /></> : null}
                {request?.preferredVendorId?.email ? <>{request.preferredVendorId.email}<br /></> : null}
                {request?.preferredVendorId?.phone ? <>{request.preferredVendorId.phone}</> : null}
                {!request?.preferredVendorId ? <>Admin Support<br />support@mappto.com</> : null}
              </p>
            </div>
          </div>

          {/* Line items */}
          <div className="overflow-hidden rounded-md border border-slate-300">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="w-8 px-2 py-2.5 sm:w-10 sm:px-3 text-[11px] font-bold uppercase tracking-wider">#</th>
                  <th className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wider sm:px-3">Description</th>
                  <th className="hidden px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider sm:table-cell sm:w-24">Rate / day</th>
                  <th className="hidden px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider sm:table-cell sm:w-14">Days</th>
                  <th className="w-24 px-2 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider sm:w-28 sm:px-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lineItems.map((row, idx) => (
                  <tr key={idx} className={idx % 2 ? 'bg-slate-50/60' : ''}>
                    <td className="px-2 py-3 align-top text-xs font-semibold text-slate-400 sm:px-3">{idx + 1}</td>
                    <td className="break-words px-2 py-3 align-top sm:px-3">
                      <p className="font-bold text-slate-900">{row.title}</p>
                      {row.sub ? <p className="text-xs text-slate-500">{row.sub}</p> : null}
                      <p className="mt-0.5 text-[11px] text-slate-500 sm:hidden">{formatMoney(row.rate)} × {row.days} {row.days === 1 ? 'day' : 'days'}</p>
                    </td>
                    <td className="hidden px-3 py-3 text-right align-top tabular-nums text-slate-700 sm:table-cell">{formatMoney(row.rate)}</td>
                    <td className="hidden px-3 py-3 text-right align-top tabular-nums text-slate-700 sm:table-cell">{row.days}</td>
                    <td className="px-2 py-3 text-right align-top font-bold tabular-nums text-slate-900 sm:px-3">{formatMoney(row.amount)}</td>
                  </tr>
                ))}
                {lineItems.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-xs text-slate-400">No line items</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Totals + notes */}
          <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-xs leading-relaxed text-slate-500 sm:max-w-xs">
              <p className="font-bold uppercase tracking-wider text-slate-400">Notes</p>
              <p className="mt-1">Thank you for booking with Mappto. This is a computer-generated invoice and does not require a signature.</p>
            </div>
            <div className="w-full sm:w-72">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold tabular-nums text-slate-900">{formatMoney(baseBookingAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Platform &amp; service fee</span><span className="font-semibold tabular-nums text-slate-900">{formatMoney(livePlatformFee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">GST</span><span className="font-semibold tabular-nums text-slate-900">{formatMoney(liveGst)}</span></div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md bg-slate-900 px-4 py-3 text-white">
                <span className="text-xs font-bold uppercase tracking-wider">{isPaid ? 'Total paid' : 'Total due'}</span>
                <span className="text-xl font-black tabular-nums">{formatMoney(liveTotal)}</span>
              </div>
            </div>
          </div>

          {!isPaid && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-md border border-brand/20 bg-brand/5 p-4 sm:flex-row print:hidden">
              <div>
                <h4 className="font-extrabold text-brand">Payment pending</h4>
                <p className="text-sm font-medium text-brand/80">Please clear the pending amount to proceed.</p>
              </div>
              <AppPrimaryButton onClick={handlePay} disabled={isPaying} className="shadow-lg shadow-brand/20">
                {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Pay'}
              </AppPrimaryButton>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-[11px] text-slate-500 sm:px-10 print:bg-transparent">
          Mappto · support@mappto.com
        </div>
      </div>

      <BookingReviewModal 
        open={showReviewModal}
        bookingId={reqId}
        revieweeId={request?.preferredVendorId?._id}
        workerName={request?.preferredVendorId?.contractorProfile?.businessName || request?.preferredVendorId?.fullName || 'Vendor'}
        onClose={() => navigate('/corporate')}
        onSubmitted={() => navigate('/corporate')}
      />
    </div>
  )
}
