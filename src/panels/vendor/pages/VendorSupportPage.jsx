import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, LifeBuoy, MessageSquare } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'

const TOPICS = [
  { id: 'supply', label: 'Supply jobs' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'payment', label: 'Payouts' },
]

export function VendorSupportPage() {
  const reduce = useReducedMotion()
  const [topicId, setTopicId] = useState(TOPICS[0].id)
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)

  const hero = (
    <section className="px-4 pb-1">
      <div className="flex items-center gap-3 rounded-[1.65rem] bg-linear-to-br from-rose-800 to-slate-900 p-4 text-white shadow-lg">
        <Link to="/vendor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <LifeBuoy className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold">Support</h1>
          <p className="text-xs text-white/75">Supply, crew & payouts</p>
        </div>
      </div>
    </section>
  )

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout hero={hero}>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopicId(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                topicId === t.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <VendorCard>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 shrink-0 text-brand" />
            <p className="text-sm font-extrabold text-slate-900">Report issue</p>
          </div>
          {sent ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
              <p className="text-sm font-semibold text-slate-800">Thanks — we&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <textarea
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                rows={4}
                placeholder="Details — include job reference"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
              />
              <AppPrimaryButton type="submit" className="w-full">
                Submit
              </AppPrimaryButton>
            </form>
          )}
        </VendorCard>
      </VendorPageLayout>
    </motion.div>
  )
}
