import React from 'react'
import { FileText, Loader2, CreditCard, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { 
  useGetCorporateInvoicesQuery,
  useGetCorporateTransactionsQuery,
  useInitPaymentMutation,
  useVerifyPaymentMutation,
  useGetRequestQuery
} from '../../../store/api/workforceApi.js'

function formatMoney(n) {
  if (n == null) return '—'
  if (typeof n === 'string' && n === '...') return n
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function InvoiceListItem({ inv }) {
  const navigate = useNavigate()
  const reqId = inv?.requestId?._id || inv?.requestId
  const { data: reqData, isLoading } = useGetRequestQuery(reqId, { skip: !reqId })
  
  const request = reqData?.request || inv.requestId
  const days = reqData?.pricingSummary?.days || (request ? Math.max(1, Math.ceil((new Date(request.endDate || request.startDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1) : 1)
  
  const serviceBreakdown = reqData?.serviceBreakdown?.length
    ? reqData.serviceBreakdown
    : (request?.lines || []).map(line => {
      const adminPrice = Number(line.adminPrice || 0)
      const qty = Number(line.quantity) || 1
      return {
        totalPriceForDuration: (adminPrice * qty * days)
      }
    })

  const baseBookingAmount = serviceBreakdown.reduce((sum, item) => sum + item.totalPriceForDuration, 0)
  
  const platformFeeConfig = reqData?.platformFeeConfig
  let livePlatformFee = 0
  if (platformFeeConfig?.isActive) {
    if (platformFeeConfig.type === 'fixed') {
      livePlatformFee = platformFeeConfig.value
    } else {
      livePlatformFee = (baseBookingAmount * platformFeeConfig.value) / 100
    }
  } else {
    livePlatformFee = inv.requestId?.platformFee ?? inv.platformFee ?? ((inv.totalAmount || inv.total || 0) * 0.05)
  }

  const liveGst = reqData?.pricingSummary?.taxAmount || 0

  const liveTotal = isLoading ? '...' : (baseBookingAmount + livePlatformFee + liveGst)

  return (
    <li>
      <AppSurface className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{inv.invoiceNumber || 'Invoice'}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              inv.status === 'PAID' || inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
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
          <p className="text-base font-black text-slate-900">{formatMoney(liveTotal)}</p>
          
          <AppPrimaryButton 
            onClick={() => navigate(`/corporate/billing/invoice/${inv._id}`)} 
            className="!py-1.5 !px-4 !text-xs whitespace-nowrap"
          >
            View Invoice
          </AppPrimaryButton>
        </div>
      </AppSurface>
    </li>
  )
}

export function CorporateBillingPage() {
  const { data: invoicesData, isLoading: invLoading, isError: invError } = useGetCorporateInvoicesQuery()
  const { data: txData, isLoading: txLoading } = useGetCorporateTransactionsQuery()

  const invoices = invoicesData?.invoices ?? []
  const transactions = txData?.transactions ?? []

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
            <InvoiceListItem key={inv._id} inv={inv} />
          ))}
        </ul>
      </div>

    </div>
  )
}
