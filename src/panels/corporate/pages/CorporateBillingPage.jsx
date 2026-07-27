import { FileText, Loader2, CreditCard, CheckCircle2 } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { 
  useGetCorporateInvoicesQuery,
  useGetCorporateTransactionsQuery,
  useInitPaymentMutation,
  useVerifyPaymentMutation
} from '../../../store/api/workforceApi.js'

function formatMoney(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function CorporateBillingPage() {
  const { data: invoicesData, isLoading: invLoading, isError: invError } = useGetCorporateInvoicesQuery()
  const { data: txData, isLoading: txLoading } = useGetCorporateTransactionsQuery()
  
  const [initPayment, { isLoading: isInitLoading }] = useInitPaymentMutation()
  const [verifyPayment, { isLoading: isVerifyLoading }] = useVerifyPaymentMutation()

  const invoices = invoicesData?.invoices ?? []
  const transactions = txData?.transactions ?? []

  const handlePay = async (invoice) => {
    try {
      // 1. Init payment
      const initRes = await initPayment({
        amount: invoice.totalAmount,
        purpose: 'INVOICE',
        invoiceId: invoice._id
      }).unwrap()

      // 2. Simulate Razorpay Checkout (mocking success)
      // In a real scenario, we'd open the Razorpay SDK here
      const mockRazorpayResponse = {
        razorpayOrderId: initRes.data?.paymentTransactionId || 'order_mock_' + Date.now(),
        razorpayPaymentId: 'pay_mock_' + Date.now(),
        razorpaySignature: 'mock_signature_123'
      }

      // 3. Verify payment
      await verifyPayment(mockRazorpayResponse).unwrap()
      alert('Payment successful!')
    } catch (err) {
      console.error('Payment failed', err)
      alert('Payment failed. Please try again.')
    }
  }

  const isPaying = isInitLoading || isVerifyLoading

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Finance</p>
        <h2 className="text-lg font-extrabold text-slate-900">Billing & Invoices</h2>
        <p className="mt-1 text-sm text-slate-600">GST-ready invoices tied to attendance.</p>
      </div>

      {/* INVOICES SECTION */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand" />
          Pending & Recent Invoices
        </h3>
        
        {invLoading ? (
          <AppSurface>
            <p className="text-sm text-slate-500">Loading invoices…</p>
          </AppSurface>
        ) : null}

        {invError ? (
          <AppSurface className="border-rose-200/90 bg-rose-50/40">
            <p className="text-sm font-semibold text-rose-800">Could not load invoices.</p>
          </AppSurface>
        ) : null}

        {!invLoading && !invError && invoices.length === 0 ? (
          <AppEmptyState
            icon={FileText}
            title="No invoices yet"
            subtitle="Invoices are generated after attendance is verified and billing runs."
          />
        ) : null}

        <ul className="space-y-3">
          {invoices.map((inv) => (
            <li key={inv._id}>
              <AppSurface className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{inv.invoiceNumber || 'Invoice'}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                      inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Generated: {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                  <p className="text-base font-black text-slate-900">{formatMoney(inv.totalAmount)}</p>
                  
                  {inv.status !== 'PAID' && (
                    <AppPrimaryButton 
                      onClick={() => handlePay(inv)} 
                      disabled={isPaying}
                      className="!py-1.5 !px-4 !text-xs whitespace-nowrap"
                    >
                      {isPaying ? (
                        <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing</>
                      ) : (
                        'Pay Now'
                      )}
                    </AppPrimaryButton>
                  )}
                </div>
              </AppSurface>
            </li>
          ))}
        </ul>
      </div>

      {/* TRANSACTIONS LEDGER */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand" />
          Transaction Ledger
        </h3>

        {txLoading ? (
          <AppSurface>
            <p className="text-sm text-slate-500">Loading ledger…</p>
          </AppSurface>
        ) : transactions.length === 0 ? (
          <AppSurface>
            <p className="text-sm text-slate-500">No payment history available.</p>
          </AppSurface>
        ) : (
          <AppSurface className="p-0 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <li key={tx._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-emerald-100 p-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {tx.purpose} Payment
                      </p>
                      <p className="text-xs text-slate-500">
                        Inv: {tx.invoiceId?.invoiceNumber || '—'} • {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">{formatMoney(tx.amount)}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{tx.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          </AppSurface>
        )}
      </div>
    </div>
  )
}
