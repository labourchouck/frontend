import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Briefcase, HardHat, PackageSearch, Store } from 'lucide-react'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { useLandingCta } from '../../hooks/useLandingCta.js'
import { optimizeImage } from '../../lib/imageUrl.js'

const FALLBACK = {
  labour: '/assets/images/labour_chowck_hero_worker.jpg',
  corporate: '/assets/images/labour_chowck_hero_cleaning_worker.jpg',
  buildmart: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900&q=70',
  vendor: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=70',
}

function pickGroupImage(groups, matcher) {
  const g = groups.find((x) => matcher.test(x.name) && x.imageUrl) || groups.find((x) => x.imageUrl)
  return g?.imageUrl || ''
}

export function EcosystemSection({ groups = [], products = [], banners = [] }) {
  const reduce = useReducedMotion()
  const cta = useLandingCta()

  const cards = [
    {
      id: 'labour',
      eyebrow: 'For homeowners & sites',
      title: 'Hire Labour',
      Icon: HardHat,
      tone: 'from-brand to-emerald-600',
      description:
        'Masons, electricians, plumbers, helpers, machine operators and home-service pros. Pick a service, set a slot, and a verified worker arrives.',
      bullets: ['Aadhaar-verified profiles', 'Transparent per-day pricing', 'Live job tracking & ratings'],
      image: pickGroupImage(groups, /construction/i) || FALLBACK.labour,
      ctaLabel: 'Book a worker',
      href: '/app',
      onClick: cta.hireLabour,
      anchor: '#labour',
    },
    {
      id: 'corporate',
      eyebrow: 'For companies & builders',
      title: 'Corporate Workforce',
      Icon: Briefcase,
      tone: 'from-slate-800 to-slate-900',
      description:
        'Raise bulk workforce requests for projects and sites, track attendance daily, and settle invoices from one dashboard with analytics.',
      bullets: ['Bulk manpower requests', 'Attendance & billing', 'Dedicated account support'],
      image: banners[0]?.imageUrl || FALLBACK.corporate,
      ctaLabel: 'Open corporate panel',
      href: '/b2b/auth',
      onClick: cta.corporate,
      anchor: '#corporate',
    },
    {
      id: 'buildmart',
      eyebrow: 'Materials marketplace',
      title: 'BuildMart',
      Icon: PackageSearch,
      tone: 'from-amber-500 to-orange-600',
      description:
        'Cement, TMT steel, bricks, pipes, paint, tiles, electricals and safety gear from trusted suppliers with contractor and bulk pricing.',
      bullets: ['Retail & contractor rates', 'Site delivery in 24–48 hrs', 'Quote requests for bulk orders'],
      image: products[0]?.image || FALLBACK.buildmart,
      ctaLabel: 'Explore BuildMart',
      href: '/app/buildmart',
      onClick: cta.buildMart,
      anchor: '#buildmart',
    },
    {
      id: 'vendor',
      eyebrow: 'For contractors & suppliers',
      title: 'Vendor Partner',
      Icon: Store,
      tone: 'from-teal-600 to-cyan-700',
      description:
        'Bring your crew, receive job assignments, mark attendance, track earnings, and list your own products on BuildMart to reach buyers.',
      bullets: ['Crew management', 'Jobs, attendance & earnings', 'Sell on BuildMart'],
      image: pickGroupImage(groups, /machine|site labour/i) || FALLBACK.vendor,
      ctaLabel: 'Become a vendor',
      href: '/b2b/auth',
      onClick: cta.vendor,
      anchor: '#vendor',
    },
  ]

  return (
    <section id="ecosystem" className="relative border-y border-slate-200/80 bg-white py-20" aria-labelledby="ecosystem-heading">
      <Container>
        <SectionHeading
          titleId="ecosystem-heading"
          eyebrow="What’s inside"
          title="Four products. One LaborChowck account."
          subtitle="Whether you need one plumber for a day, 200 workers for a plant, ten tonnes of sand, or a way to sell your services and stock, there’s a dedicated space for you."
          align="center"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.06}>
              <motion.article
                className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-sm"
                whileHover={reduce ? undefined : { y: -6, boxShadow: '0 30px 70px -30px rgba(15,23,42,0.35)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <div className="relative h-52 overflow-hidden sm:h-60">
                  <motion.img
                    src={optimizeImage(c.image, { w: 900 })}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    whileHover={reduce ? undefined : { scale: 1.06 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${c.tone} opacity-70 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                  <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur">
                    <c.Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                    {c.eyebrow}
                  </div>
                  <h3 className="absolute bottom-5 left-5 text-2xl font-extrabold tracking-tight text-white drop-shadow">
                    {c.title}
                  </h3>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm leading-relaxed text-slate-600">{c.description}</p>
                  <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3 sm:gap-3">
                    {c.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium ring-1 ring-slate-200/70">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <a
                      href={c.anchor}
                      className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
                    >
                      Learn more
                    </a>
                    <a
                      href={c.href}
                      onClick={c.onClick}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand"
                    >
                      {c.ctaLabel}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
