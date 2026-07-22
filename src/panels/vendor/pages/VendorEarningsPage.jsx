import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IndianRupee } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppButton } from '../../../components/app-ui/buttons/AppButton.jsx'
import { AppSectionHeader } from '../../../components/app-ui/layout/AppSectionHeader.jsx'
import { VendorEarningsHero } from '../../../components/vendor/VendorEarningsHero.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { isVendorPanelUnlocked } from '../../../lib/vendorDemo.js'
import { formatVendorInr } from '../../../lib/vendorUiHelpers.js'
import { vendorApi } from '../../../api/vendorApi.js'

export function VendorEarningsPage() {
  const reduce = useReducedMotion()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawSent, setWithdrawSent] = useState(false)
  const [stats, setStats] = useState({})
  const [invoices, setInvoices] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, setRes, wRes] = await Promise.all([
        vendorApi.getDashboardStats(),
        vendorApi.getSettlements(),
        vendorApi.getWithdrawals()
      ])
      setStats(statsRes?.data?.stats || {})
      setInvoices(setRes?.data?.settlements || [])
      setWithdrawals(wRes?.data?.withdrawals || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!withdrawAmount.trim()) return
    
    try {
      await vendorApi.requestWithdrawal({ amount: Number(withdrawAmount) })
      setWithdrawSent(true)
      setWithdrawOpen(false)
      setWithdrawAmount('')
      await fetchData() // Refresh data
    } catch (err) {
      alert(err?.data?.message || err?.message || 'Withdrawal request failed')
    }
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
          {loading ? <VendorCard className="text-sm text-slate-500">Loading…</VendorCard> : null}
          {!loading && invoices.length === 0 ? (
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
