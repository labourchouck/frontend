import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, MapPin, PackageCheck, Star, Truck } from 'lucide-react'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { useLandingCta } from '../../hooks/useLandingCta.js'
import { optimizeImage } from '../../lib/imageUrl.js'

const AVAILABILITY = {
  in_stock: { label: 'In stock', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80' },
  limited: { label: 'Limited', cls: 'bg-amber-50 text-amber-800 ring-amber-200/80' },
  preorder: { label: 'Pre-order', cls: 'bg-sky-50 text-sky-800 ring-sky-200/80' },
}

function formatPrice(label) {
  const s = String(label || '').trim()
  if (!s) return ''
  return /₹|from/i.test(s) ? s : `₹${s}`
}

function ProductCard({ p, reduce }) {
  const avail = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock
  return (
    <motion.article
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white shadow-sm"
      whileHover={reduce ? undefined : { y: -5, boxShadow: '0 26px 60px -30px rgba(15,23,42,0.35)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <motion.img
          src={optimizeImage(p.image, { w: 520, h: 390, crop: 'fill' })}
          alt={p.name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          whileHover={reduce ? undefined : { scale: 1.06 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${avail.cls}`}>
          {avail.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{p.brand || 'BuildMart'}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900">{p.name}</h3>
        {p.supplier?.name ? (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3" aria-hidden />
            {p.supplier.name}
            {p.supplier.city ? ` · ${p.supplier.city}` : ''}
            {p.supplier.rating ? (
              <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-slate-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                {p.supplier.rating}
              </span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-auto pt-3 text-base font-extrabold text-slate-900">{formatPrice(p.priceLabel)}</p>
      </div>
    </motion.article>
  )
}

export function BuildMartSection({ martCategories = [], products = [], loading = false }) {
  const reduce = useReducedMotion()
  const cta = useLandingCta()
  const featured = products.slice(0, 8)
  const cats = martCategories.filter((c) => c.icon).slice(0, 14)

  return (
    <section id="buildmart" className="relative bg-white py-20" aria-labelledby="buildmart-heading">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(245,158,11,0.10),transparent)]" />
      <Container className="relative">
        <SectionHeading
          titleId="buildmart-heading"
          eyebrow="BuildMart · materials marketplace"
          title={products.length ? `${products.length}+ building materials, delivered to site` : 'Building materials, delivered to site'}
          subtitle="From cement and TMT steel to paint, tiles, plumbing and safety gear. Retail, contractor and bulk pricing from verified suppliers, with quote requests for large orders."
          align="center"
        />

        {cats.length ? (
          <motion.ul
            className="mb-12 flex flex-wrap justify-center gap-3"
            aria-label="BuildMart categories"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {cats.map((c) => (
              <motion.li
                key={c.id}
                variants={{ hidden: reduce ? {} : { opacity: 0, y: 10, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1 } }}
              >
                <a
                  href="/app/buildmart"
                  onClick={cta.buildMart}
                  className="flex w-24 flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
                >
                  <img
                    src={optimizeImage(c.icon, { w: 120, h: 120, crop: 'fill' })}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="text-[11px] font-semibold leading-tight text-slate-700">{c.name}</span>
                </a>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !featured.length
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-[1.5rem] bg-slate-100 ring-1 ring-slate-200/70" aria-hidden />
              ))
            : featured.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 0.06}>
                  <ProductCard p={p} reduce={reduce} />
                </Reveal>
              ))}
        </div>

        <Reveal className="mt-12">
          <div className="grid gap-4 rounded-[2rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { Icon: PackageCheck, t: 'Retail · contractor · bulk', d: 'Three price tiers with MOQ shown upfront.' },
                { Icon: Truck, t: 'Site drop in 24–48 hrs', d: 'Delivery info per product before you order.' },
                { Icon: Star, t: 'Rated suppliers', d: 'Every listing carries the supplier name, city and rating.' },
              ].map((f) => (
                <div key={f.t} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <f.Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{f.t}</p>
                    <p className="text-xs text-slate-600">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <ButtonLink href="/app/buildmart" variant="primary" onClick={cta.buildMart} className="group !bg-none !bg-slate-900 hover:!bg-amber-600">
              Explore BuildMart
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
