import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, IndianRupee, Wallet } from 'lucide-react'
import { formatVendorInr } from '../../lib/vendorUiHelpers.js'

export function VendorEarningsHero({ availableBalance, pendingPayout, monthEarnings }) {
  const reduce = useReducedMotion()

  return (
    <section className="relative px-4 pb-1">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.65rem] border border-white/15 bg-linear-to-br from-emerald-900 via-slate-900 to-slate-950 text-white shadow-[0_22px_48px_-20px_rgba(0,0,0,0.55)]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=60')] bg-cover bg-center opacity-20"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-950/85 via-slate-900/80 to-brand/20" aria-hidden />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Link
              to="/vendor"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 hover:bg-white/20"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
              <Wallet className="h-5 w-5 text-emerald-200" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Payouts</p>
              <h1 className="text-xl font-extrabold tracking-tight">Earnings & withdraw</h1>
            </div>
          </div>

          <p className="mt-4 font-mono text-3xl font-black tabular-nums">{formatVendorInr(availableBalance)}</p>
          <p className="mt-1 text-xs text-white/70">Available for withdrawal</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-100/90">Pending</p>
              <p className="mt-0.5 font-mono text-lg font-black tabular-nums">{formatVendorInr(pendingPayout)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/8 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/55">This month</p>
              <p className="mt-0.5 font-mono text-lg font-black tabular-nums">{formatVendorInr(monthEarnings)}</p>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-white/55">
            <IndianRupee className="h-3 w-3" aria-hidden />
            Attendance-based vendor settlements
          </p>
        </div>
      </motion.div>
    </section>
  )
}
