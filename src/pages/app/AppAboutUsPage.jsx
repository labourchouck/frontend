import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react'

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
  const navigate = useNavigate()

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-slate-50 pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="text-lg font-bold text-slate-900">About us</h1>
      </header>

      <div className="space-y-5 px-4 pt-5">
        <div className="rounded-3xl bg-linear-to-br from-brand to-emerald-700 p-6 text-white shadow-[0_20px_48px_-24px_rgba(28,175,98,0.55)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
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
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
