import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Loader2, Download, Printer } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { 
  useGetCorporateInvoicesQuery,
  useInitPaymentMutation,
  useVerifyPaymentMutation
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

  const isPaying = isInitLoading || isVerifyLoading

  const handlePay = async () => {
    if (!invoice) return
    try {
      // 1. Init payment
      const initRes = await initPayment({
        amount: invoice.totalAmount,
        purpose: 'INVOICE',
        invoiceId: invoice._id
      }).unwrap()

      // 2. Simulate Razorpay Checkout
      const mockRazorpayResponse = {
        razorpayOrderId: initRes.data?.paymentTransactionId || 'order_mock_' + Date.now(),
        razorpayPaymentId: 'pay_mock_' + Date.now(),
        razorpaySignature: 'mock_signature_123'
      }

      // 3. Verify payment
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

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/corporate/billing')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Billing
        </button>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button className="flex items-center gap-2 text-xs font-bold text-brand bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Top Accent */}
        <div className="h-2 w-full bg-brand"></div>
        
        <div className="p-8 md:p-12">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
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
                invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                invoice.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {invoice.status}
              </span>
              <p className="mt-3 text-sm text-slate-500 font-medium">
                Issue Date: <span className="font-bold text-slate-800">{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <hr className="border-slate-100 mb-10" />

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
              <h3 className="text-sm font-extrabold text-slate-900">Corporate Client</h3>
              <p className="text-sm text-slate-600 mt-1">
                Project/Site: {invoice.projectId?.name || 'N/A'}<br />
                {invoice.siteId?.address || 'N/A'}
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
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mb-10">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Description</th>
                  <th className="p-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">Labour Services Billed</p>
                    <p className="text-xs text-slate-500 mt-0.5">Based on verified attendance and request terms.</p>
                  </td>
                  <td className="p-4 text-right font-extrabold text-slate-700">
                    {formatMoney(invoice.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="flex justify-end mb-12">
            <div className="w-full md:w-1/2 lg:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-600">Subtotal</p>
                <p className="text-sm font-bold text-slate-800">{formatMoney(invoice.totalAmount)}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-slate-600">Taxes</p>
                <p className="text-sm font-bold text-slate-800">Included</p>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Total Due</p>
                <p className="text-2xl font-black text-brand">{formatMoney(invoice.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Payment Action */}
          {invoice.status !== 'PAID' && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-brand/5 p-6 rounded-2xl border border-brand/20">
              <div>
                <h4 className="font-extrabold text-brand mb-1">Payment Pending</h4>
                <p className="text-sm font-medium text-slate-600">Please process the payment to settle this invoice.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <AppPrimaryButton 
                  onClick={handlePay} 
                  disabled={isPaying}
                  className="!px-8 !py-3 !text-sm"
                >
                  {isPaying ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Payment</>
                  ) : (
                    'Proceed to Pay'
                  )}
                </AppPrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
