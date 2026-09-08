import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BadgeIndianRupee, CalendarCheck2, ClipboardCheck, Store, UsersRound } from 'lucide-react'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { useLandingCta } from '../../hooks/useLandingCta.js'
import { optimizeImage } from '../../lib/imageUrl.js'

const FALLBACK = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&q=70'

const steps = [
  {
    Icon: UsersRound,
    title: 'Onboard your crew',
    text: 'Add workers with skills, KYC and rates. Manage them as one team under your vendor profile.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Receive job assignments',
    text: 'Corporate and individual requests matched to your crew’s trades and location, with clear scope.',
  },
  {
    Icon: CalendarCheck2,
    title: 'Attendance & earnings',
    text: 'Mark daily attendance per job and watch payouts, deductions and analytics update in real time.',
  },
  {
    Icon: Store,
    title: 'Sell on BuildMart',
    text: 'List products with photos and variants, receive buyer enquiries, and upgrade with a mart subscription.',
  },
]

export function VendorSection({ groups = [], products = [] }) {
  const reduce = useReducedMotion()
  const cta = useLandingCta()

  const cover =
    groups.find((g) => /machine|site labour|construction/i.test(g.name) && g.imageUrl)?.imageUrl ||
    groups.find((g) => g.imageUrl)?.imageUrl ||
    FALLBACK
  const thumbs = products.slice(8, 11).map((p) => p.image).filter(Boolean)

  return (
    <section id="vendor" className="relative overflow-hidden bg-slate-50/70 py-20" aria-labelledby="vendor-heading">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(13,148,136,0.10),transparent)]" />
      <Container className="relative grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <Reveal>
          <div className="relative">
            <div className="relative aspect-[4/4.2] overflow-hidden rounded-[2.25rem] shadow-[0_40px_90px_-40px_rgba(15,23,42,0.45)]">
              <motion.img
                src={optimizeImage(cover, { w: 1000 })}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                initial={reduce ? false : { scale: 1.1 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-bright">Vendor panel</p>
                <p className="mt-1 text-xl font-extrabold">Your crew. Your catalogue. One dashboard.</p>
              </div>
            </div>

            <motion.div
              className="absolute right-0 top-8 w-44 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur sm:-right-6"
              initial={reduce ? false : { opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <p className="text-[11px] font-semibold text-slate-500">This week’s earnings</p>
              <p className="text-xl font-black text-slate-900">₹ 68,400</p>
              <div className="mt-2 flex items-end gap-1" aria-hidden>
                {[40, 55, 45, 70, 62, 85, 78].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-full rounded-sm bg-brand/80"
                    initial={reduce ? false : { height: 0 }}
                    whileInView={{ height: `${h * 0.4}px` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                  />
                ))}
              </div>
            </motion.div>

            {thumbs.length ? (
              <motion.div
                className="absolute left-0 bottom-24 rounded-2xl border border-white/80 bg-white/95 p-2.5 shadow-xl backdrop-blur sm:-left-6"
                initial={reduce ? false : { opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                <p className="mb-1.5 text-[10px] font-semibold text-slate-500">Listed on BuildMart</p>
                <div className="flex -space-x-2">
                  {thumbs.map((src) => (
                    <img
                      key={src}
                      src={optimizeImage(src, { w: 80, h: 80, crop: 'fill' })}
                      alt=""
                      className="h-9 w-9 rounded-lg border-2 border-white object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-brand text-[10px] font-bold text-white">
                    +{Math.max(products.length - thumbs.length, 0)}
                  </span>
                </div>
              </motion.div>
            ) : null}
          </div>
        </Reveal>

        <div>
          <SectionHeading
            titleId="vendor-heading"
            eyebrow="Vendors · contractors & suppliers"
            title="Grow your labour business and sell materials"
            subtitle="Thekedars, small contractors and suppliers register once as a Vendor. Supply crews to corporate sites, keep attendance and earnings clean, and open a BuildMart storefront."
          />

          <ol className="relative space-y-4 border-l border-slate-200 pl-6">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <li className="relative">
                  <span className="absolute -left-[2.05rem] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand ring-2 ring-brand/30">
                    <s.Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/b2b/auth" variant="primary" onClick={cta.vendor} className="group">
              Register as Vendor
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </ButtonLink>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <BadgeIndianRupee className="h-4 w-4 text-brand" aria-hidden />
              Weekly payouts · GST invoices · wallet withdrawals
            </span>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
