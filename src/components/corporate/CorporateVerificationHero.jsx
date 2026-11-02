import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const TONE_GRADIENT = {
  emerald: 'from-emerald-900 via-slate-900 to-slate-950',
  sky: 'from-sky-900 via-slate-900 to-slate-950',
  rose: 'from-rose-900 via-slate-900 to-slate-950',
  violet: 'from-brand/90 via-slate-900 to-slate-950',
}

export function CorporateVerificationHero({ title, subtitle, tone = 'violet', companyLine }) {
  const reduce = useReducedMotion()
  const gradient = TONE_GRADIENT[tone] || TONE_GRADIENT.violet

  return (
    <section className="relative -mx-4 px-4 pb-1">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-[1.65rem] border border-white/15 bg-linear-to-br ${gradient} text-white shadow-[0_22px_48px_-20px_rgba(0,0,0,0.55)]`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92fd1ab?w=800&q=60')] bg-cover bg-center opacity-20"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-950/88 via-slate-900/85 to-brand/20" aria-hidden />

        <div className="relative p-4 sm:p-5">
          <p className="text-sm font-bold leading-snug text-white/95">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">{subtitle}</p>
          {companyLine ? <p className="mt-2 text-sm font-extrabold text-white/90">{companyLine}</p> : null}

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            <p className="text-[11px] leading-relaxed text-white/75">
              Documents are reviewed manually by Mappto operations before bulk workforce access unlocks.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
