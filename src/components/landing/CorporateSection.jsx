import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ChartBar,
  Building2,
  CalendarCheck2,
  ClipboardList,
  FileText,
  Headset,
} from 'lucide-react'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { useLandingCta } from '../../hooks/useLandingCta.js'
import { optimizeImage } from '../../lib/imageUrl.js'

const capabilities = [
  {
    Icon: ClipboardList,
    title: 'Bulk workforce requests',
    text: 'Raise a request for any trade, headcount and duration. We allocate verified workers to your site or project.',
  },
  {
    Icon: CalendarCheck2,
    title: 'Daily attendance',
    text: 'Site-wise check-ins, overtime and no-show visibility so supervisors stop chasing registers.',
  },
  {
    Icon: FileText,
    title: 'Billing & invoices',
    text: 'GST-ready invoices per request, consolidated billing and downloadable statements for audits.',
  },
  {
    Icon: ChartBar,
    title: 'Analytics & subscription',
    text: 'Spend, utilisation and fulfilment dashboards plus subscription plans for predictable costs.',
  },
]

const FALLBACK_BANNER = '/assets/images/labour_chowck_hero_cleaning_worker.jpg'

function BannerCarousel({ banners, reduce }) {
  const slides = banners.length ? banners : [{ id: 'fallback', imageUrl: FALLBACK_BANNER }]
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (slides.length < 2 || reduce) return undefined
    const t = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), 4200)
    return () => window.clearInterval(t)
  }, [slides.length, reduce])

  const current = slides[idx % slides.length]

  return (
    <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-emerald-950">
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={current.id}
          src={optimizeImage(current.imageUrl, { w: 1000 })}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          loading="lazy"
          decoding="async"
        />
      </AnimatePresence>
      {slides.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx % slides.length ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              aria-label={`Show banner ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DashboardMock({ banners, reduce }) {
  const rows = [
    { label: 'Masons · Tower B', qty: 24, status: 'On site', tone: 'bg-emerald-400' },
    { label: 'Helpers · Basement', qty: 40, status: 'Allocated', tone: 'bg-sky-400' },
    { label: 'Electricians · Phase 2', qty: 8, status: 'Pending', tone: 'bg-amber-400' },
  ]

  return (
    <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
            <Building2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold text-white">Corporate dashboard</p>
            <p className="text-[10px] text-zinc-400">Skyline Infra Pvt. Ltd.</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
          Approved
        </span>
      </div>

      <BannerCarousel banners={banners} reduce={reduce} />

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { k: 'Active workers', v: '72' },
          { k: 'Attendance today', v: '96%' },
          { k: 'Pending invoices', v: '₹1.8L' },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10">
            <p className="text-[10px] text-zinc-400">{s.k}</p>
            <p className="text-lg font-black text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <motion.li
            key={r.label}
            className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3 py-2 text-xs ring-1 ring-white/10"
            initial={reduce ? false : { opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.08 }}
          >
            <span className="flex items-center gap-2 text-zinc-200">
              <span className={`h-1.5 w-1.5 rounded-full ${r.tone}`} />
              {r.label}
            </span>
            <span className="flex items-center gap-3">
              <span className="font-bold text-white">{r.qty}</span>
              <span className="text-[10px] text-zinc-400">{r.status}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export function CorporateSection({ banners = [] }) {
  const reduce = useReducedMotion()
  const cta = useLandingCta()

  return (
    <section
      id="corporate"
      className="relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 py-20 text-white"
      aria-labelledby="corporate-heading"
    >
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2240%22%20height=%2240%22%3E%3Cpath%20d=%22M0%2040h40V0%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20stroke-opacity=%22.04%22/%3E%3C/svg%3E')]" />

      <Container className="relative grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <SectionHeading
            titleId="corporate-heading"
            eyebrow="Corporate · B2B"
            title="Staff entire projects, not just a shift"
            subtitle="Builders, infra companies, factories and facility teams use the Corporate panel to request manpower at scale, verify attendance, and pay on one invoice."
            dark
          />

          <ul className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06}>
                <motion.li
                  className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  whileHover={reduce ? undefined : { y: -4, borderColor: 'rgba(71,224,138,0.45)' }}
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20 text-brand-bright ring-1 ring-brand/30">
                    <c.Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{c.text}</p>
                </motion.li>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/b2b/auth" variant="primary" onClick={cta.corporate} className="group">
              Register your company
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </ButtonLink>
            <span className="flex items-center gap-2 text-xs text-zinc-400">
              <Headset className="h-4 w-4 text-brand-bright" aria-hidden />
              Account manager &amp; custom SLAs for large sites
            </span>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <DashboardMock banners={banners} reduce={reduce} />
        </Reveal>
      </Container>
    </section>
  )
}
