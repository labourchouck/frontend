import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IndianRupee } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppButton } from '../../../components/app-ui/buttons/AppButton.jsx'
import { AppSectionHeader } from '../../../components/app-ui/layout/AppSectionHeader.jsx'
import { VendorEarningsHero } from '../../../components/vendor/VendorEarningsHero.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { VENDOR_DEMO_MODE } from '../../../lib/vendorDemo.js'
import { formatVendorInr } from '../../../lib/vendorUiHelpers.js'
import {
  VENDOR_DUMMY_INVOICES,
  VENDOR_DUMMY_STATS,
  VENDOR_DUMMY_WITHDRAWALS,
} from '../../../lib/vendorDummyData.js'
import { useGetVendorSettlementsQuery } from '../../../store/api/workforceApi.js'

export function VendorEarningsPage() {
  const reduce = useReducedMotion()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawSent, setWithdrawSent] = useState(false)
  const { data, isLoading, isError } = useGetVendorSettlementsQuery(undefined, { skip: VENDOR_DEMO_MODE })
  const invoices = VENDOR_DEMO_MODE ? VENDOR_DUMMY_INVOICES : (data?.invoices ?? [])
  const stats = VENDOR_DEMO_MODE ? VENDOR_DUMMY_STATS : {}
  const withdrawals = VENDOR_DEMO_MODE ? VENDOR_DUMMY_WITHDRAWALS : []

  const handleWithdraw = (e) => {
    e.preventDefault()
    if (!withdrawAmount.trim()) return
    setWithdrawSent(true)
    setWithdrawOpen(false)
    setWithdrawAmount('')
  }

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout
        hero={
          <VendorEarningsHero
            availableBalance={stats.availableBalance ?? 0}
            pendingPayout={stats.pendingPayout ?? 0}
            monthEarnings={stats.earningsMonth ?? 0}
          />
        }
      >
        <AppPrimaryButton type="button" className="w-full" onClick={() => setWithdrawOpen(true)}>
          Request withdrawal
        </AppPrimaryButton>

        {withdrawSent ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900">
            Withdrawal request submitted. Processing in 2–3 business days.
          </p>
        ) : null}

        {withdrawOpen ? (
          <VendorCard>
            <p className="text-sm font-extrabold text-slate-900">Withdraw to bank</p>
            <form onSubmit={handleWithdraw} className="mt-3 space-y-3">
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Amount (INR)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <AppPrimaryButton type="submit" className="flex-1">
                  Submit
                </AppPrimaryButton>
                <AppButton type="button" variant="secondary" className="flex-1" onClick={() => setWithdrawOpen(false)}>
                  Cancel
                </AppButton>
              </div>
            </form>
          </VendorCard>
        ) : null}

        {withdrawals.length > 0 ? (
          <section>
            <AppSectionHeader title="Recent withdrawals" />
            <ul className="mt-2 space-y-2">
              {withdrawals.map((w) => (
                <li key={w._id}>
                  <VendorCard className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{formatVendorInr(w.amount)}</p>
                      <p className="text-xs capitalize text-slate-500">{w.status}</p>
                    </div>
                  </VendorCard>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <AppSectionHeader title="Settlements" />
          {isLoading && !VENDOR_DEMO_MODE ? <VendorCard className="text-sm text-slate-500">Loading…</VendorCard> : null}
          {isError && !VENDOR_DEMO_MODE ? (
            <VendorCard className="text-sm text-rose-800">Could not load settlements.</VendorCard>
          ) : null}
          {!isLoading && invoices.length === 0 ? (
            <AppEmptyState icon={IndianRupee} title="No settlements" subtitle="Invoices appear after billing runs." />
          ) : null}
          <ul className="mt-2 space-y-2">
            {invoices.map((inv) => (
              <li key={inv._id}>
                <VendorCard className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{inv.invoiceNumber}</p>
                    <p className="text-xs capitalize text-slate-500">{inv.status}</p>
                    {inv.periodLabel ? <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{inv.periodLabel}</p> : null}
                  </div>
                  <p className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900">{formatVendorInr(inv.totalAmount)}</p>
                </VendorCard>
              </li>
            ))}
          </ul>
        </section>
      </VendorPageLayout>
    </motion.div>
  )
}
