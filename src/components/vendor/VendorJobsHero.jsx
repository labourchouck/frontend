import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ClipboardList, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react'

export function VendorJobsHero({ pendingCount, activeCount, verified }) {
  const reduce = useReducedMotion()

  return (
    <section className="relative px-4 pb-1">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.65rem] border border-white/15 bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-[0_22px_48px_-20px_rgba(0,0,0,0.55)]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=60')] bg-cover bg-center opacity-22"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-950/90 via-slate-900/80 to-brand/25" aria-hidden />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Link
              to="/vendor"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm hover:bg-white/20"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/25">
              <ClipboardList className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Supply</p>
              <h1 className="mt-0.5 text-xl font-extrabold tracking-tight">Admin allocations</h1>
              <p className="mt-1.5 text-xs text-white/75">Accept FCFS jobs and deploy your crew to corporate sites.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-100/90">Pending accept</p>
              <p className="mt-0.5 font-mono text-2xl font-black tabular-nums">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100/90">Active supply</p>
              <p className="mt-0.5 font-mono text-2xl font-black tabular-nums">{activeCount}</p>
            </div>
          </div>

          {!verified ? (
            <Link
              to="/vendor/profile"
              className="mt-3 flex items-center justify-between rounded-2xl border border-amber-300/40 bg-amber-500/20 px-3 py-2.5 text-xs font-bold text-amber-50"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" aria-hidden />
                Complete vendor verification
              </span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-100/90">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Verified — ready to supply workforce
            </p>
          )}
        </div>
      </motion.div>
    </section>
  )
}
