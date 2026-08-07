import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Loader2, Download, Printer } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { 
  useGetCorporateInvoicesQuery,
  useInitPaymentMutation,
  useVerifyPaymentMutation,
  useGetRequestQuery
} from '../../../store/api/workforceApi.js'

function formatMoney(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function CorporateInvoicePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
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

      const mockRazorpayResponse = {
        razorpayOrderId: initRes.data?.paymentTransactionId || 'order_mock_' + Date.now(),
        razorpayPaymentId: 'pay_mock_' + Date.now(),
        razorpaySignature: 'mock_signature_123'
      }

      await verifyPayment(mockRazorpayResponse).unwrap()
      alert('Payment successful!')
      navigate('/corporate/billing')
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

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto print:p-0 print:m-0 print:space-y-0">
      <header className="sticky top-0 z-30 pt-3 mb-6 print:hidden">
        <GlassPanel className="flex items-center justify-between px-3 py-2.5">
          <button 
            onClick={() => navigate('/corporate/billing')}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Billing
          </button>
          <div className="flex gap-2">
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
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </GlassPanel>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="h-2 w-full bg-brand"></div>
        
        <div className="p-8 md:p-12 print:p-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 print:mb-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-8 h-8 text-brand" />
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">INVOICE</h1>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Invoice Number</p>
              <p className="text-lg font-extrabold text-slate-800">{invoice.invoiceNumber || 'INV-000000'}</p>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                invoice.status === 'paid' || invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                'bg-amber-100 text-amber-700'
              }`}>
                {invoice.status}
              </span>
              <p className="mt-3 text-sm text-slate-500 font-medium">
                Issue Date: <span className="font-bold text-slate-800">{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <hr className="border-slate-100 mb-10 print:mb-4 print:mt-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 print:mb-4 print:gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
              <h3 className="text-sm font-extrabold text-slate-900">
                {invoice.corporateId?.corporateProfile?.businessName || invoice.corporateId?.fullName || 'Corporate Client'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {invoice.corporateId?.email}<br />
                {invoice.corporateId?.phone}<br />
                Project: {invoice.projectId?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">From</p>
              <h3 className="text-sm font-extrabold text-slate-900">LabourChowk Platform</h3>
              <p className="text-sm text-slate-600 mt-1">
                Admin Support<br />
                support@labourchowk.com
              </p>
            </div>
            {request?.preferredVendorId && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor Information</p>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {request.preferredVendorId?.contractorProfile?.businessName || 'Independent Vendor'}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-semibold text-slate-800">{request.preferredVendorId?.fullName}</span><br />
                  {request.preferredVendorId?.email}<br />
                  {request.preferredVendorId?.phone}
                </p>
              </div>
            )}
          </div>

          <div className="mb-12 print:mb-6 rounded-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 align-top">
                      <p className="font-bold text-slate-900">{item.serviceName}</p>
                      
                      {item.labourers?.length > 0 && (
                        <div className="mt-2">
                          <ul className="list-disc list-inside space-y-0.5">
                            {item.labourers.map((crew, lIdx) => (
                                <li key={crew._id || lIdx} className="text-xs text-slate-600">
                                  <span className="font-semibold text-slate-800">{crew.labourName}</span>
                                  <span className="text-slate-400 mx-1.5">—</span>
                                  <span>₹{Math.round(crew.adminPrice).toLocaleString('en-IN')}/day</span>
                                </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-700 align-top">
                      {formatMoney(item.totalPriceForDuration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-12 print:mb-0">
            <div className="w-full md:w-1/2 lg:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-100 print:p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-600">Subtotal</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatMoney(baseBookingAmount)}
                </p>
              </div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-600">Platform & Service Fee</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatMoney(livePlatformFee)}
                </p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-slate-600">GST (Taxes)</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatMoney(liveGst)}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Total Due (Paid)</p>
                <p className="text-2xl font-black text-brand">{formatMoney(liveTotal)}</p>
              </div>
            </div>
          </div>

          {invoice.status?.toLowerCase() !== 'paid' && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-brand/5 p-6 rounded-2xl border border-brand/20 print:hidden">
              <div>
                <h4 className="font-extrabold text-brand mb-1">Payment Pending</h4>
                <p className="text-sm text-brand/80 font-medium">Please clear the pending amount to proceed.</p>
              </div>
              <AppPrimaryButton 
                onClick={handlePay} 
                disabled={isPaying} 
                className="mt-4 sm:mt-0 shadow-lg shadow-brand/20"
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Pay'}
              </AppPrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
