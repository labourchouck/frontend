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
      setInvoices(setRes?.data?.invoices || [])
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

  const [accountName, setAccountName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  const handleWithdraw = async (e) => {
    e.preventDefault()
    if (!withdrawAmount.trim()) return
    
    try {
      await vendorApi.requestWithdrawal({ 
        amount: Number(withdrawAmount),
        bankDetails: {
          accountHolderName: accountName,
          bankName,
          accountNumber: accountNo,
          ifscCode,
          qrCodeUrl
        }
      })
      setWithdrawSent(true)
      setWithdrawOpen(false)
      setWithdrawAmount('')
      setAccountName('')
      setBankName('')
      setAccountNo('')
      setIfscCode('')
      setQrCodeUrl('')
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
            totalBookingAmount={stats.totalBookingAmount ?? 0}
            totalPaid={stats.totalPaid ?? 0}
            dueAmount={stats.dueAmount ?? 0}
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
                placeholder="Amount to withdraw (INR)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Account No."
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="IFSC Code"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                required
              />
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500 bg-white">
                <p className="mb-2 text-xs font-semibold text-slate-700">QR Code (Optional)</p>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => setQrCodeUrl(reader.result)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
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

        <section>
          <AppSectionHeader title="Recent Withdrawals" />
          {loading ? <VendorCard className="text-sm text-slate-500">Loading…</VendorCard> : null}
          {!loading && withdrawals.length === 0 ? (
            <AppEmptyState icon={IndianRupee} title="No withdrawals" subtitle="You haven't made any withdrawal requests yet." />
          ) : null}
          <ul className="mt-2 space-y-3">
            {withdrawals.map((w) => {
              let statusBg = 'bg-amber-100'
              let statusText = 'text-amber-700'
              if (w.status === 'APPROVED') {
                statusBg = 'bg-emerald-100'
                statusText = 'text-emerald-700'
              } else if (w.status === 'REJECTED') {
                statusBg = 'bg-rose-100'
                statusText = 'text-rose-700'
              }

              return (
                <li key={w._id}>
                  <VendorCard className="flex items-center justify-between gap-3 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xl font-bold tracking-tight text-slate-900">{formatVendorInr(w.amount)}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(w.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusBg} ${statusText}`}>
                      {w.status}
                    </div>
                  </VendorCard>
                </li>
              )
            })}
          </ul>
        </section>
      </VendorPageLayout>
    </motion.div>
  )
}
