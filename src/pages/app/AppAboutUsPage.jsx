import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, HeartHandshake, Headset, ShieldCheck, Sparkles } from 'lucide-react'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verified, every time',
    body: 'Every worker on Mappto is Aadhaar-verified before they can accept a job, so you know exactly who is coming to your site.',
  },
  {
    icon: Sparkles,
    title: 'One platform, every need',
    body: 'Hire labour, staff corporate projects, buy materials on BuildMart, and run your own crew as a vendor — all from one app.',
  },
  {
    icon: HeartHandshake,
    title: 'Fair for workers too',
    body: 'Transparent payouts, on-time settlements, and a referral program that rewards the community that keeps Mappto running.',
  },
]

export function AppAboutUsPage() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="space-y-5 pb-6"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AppStackScreenHeader title="About us" backTo="/app/profile" />

      <div className="rounded-3xl bg-linear-to-br from-brand to-emerald-700 p-6 text-white shadow-[0_20px_48px_-24px_rgba(28,175,98,0.55)]">
        <img src="/assets/images/mappto_logo.png" alt="Mappto" className="h-12 w-12 rounded-2xl ring-2 ring-white/40" />
        <h2 className="mt-4 text-xl font-black tracking-tight">India's workforce &amp; materials platform</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-white/85">
          Mappto connects households, corporates, and site owners with verified labour, bulk
          construction materials, and trusted vendors — everywhere, har jagah.
        </p>
      </div>

      <div className="space-y-3">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/app/support"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition hover:border-brand/30"
      >
        <span className="flex items-center gap-3">
          <Headset className="h-[18px] w-[18px] text-slate-500" aria-hidden />
          <span className="text-sm font-semibold text-slate-800">Questions? Talk to support</span>
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
      </Link>
    </motion.div>
  )
}
