import { Link, useNavigate } from 'react-router-dom'
import { formatBuildMartPrice, getBuildMartOffer } from '../../../../data/buildmartCatalog.js'
import { HomeSectionHeader } from './HomeSectionHeader.jsx'

function MartCard({ product }) {
  const variant = product.variants?.[0]
  const offer = getBuildMartOffer(variant)
  const href = `/app/buildmart/product/${product.id || product._id}`

  return (
    <div className="flex w-[128px] shrink-0 snap-start flex-col">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
        <Link to={href} className="block h-full w-full p-2">
          <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
        </Link>
        {offer.hasOffer ? (
          <span className="absolute left-0 top-0 rounded-br-xl rounded-tl-2xl bg-[#3567E8] px-1.5 py-1 text-center text-[9px] font-black leading-none text-white">
            {offer.discountPercent}%<br />OFF
          </span>
        ) : null}
        <Link
          to={href}
          className="absolute bottom-2 right-2 rounded-lg border border-brand bg-white px-3 py-1 text-[11px] font-black tracking-wide text-brand shadow-[0_4px_10px_-4px_rgba(15,23,42,0.4)] transition hover:bg-brand hover:text-white"
        >
          VIEW
        </Link>
      </div>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[15px] font-black leading-none text-slate-900">
          {variant ? formatBuildMartPrice(variant.retailPrice) : product.priceLabel}
        </span>
        {offer.hasOffer ? (
          <span className="text-[10px] font-semibold text-slate-400 line-through">
            {formatBuildMartPrice(variant.mrp)}
          </span>
        ) : null}
      </p>
      <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-slate-800">{product.name}</p>
      {variant?.unit ? <p className="mt-auto pt-1 text-[10px] font-medium text-slate-500">per {variant.unit}</p> : null}
    </div>
  )
}

export function HomeMartRail({ products, loading }) {
  const navigate = useNavigate()
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square w-[128px] shrink-0 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }
  if (!products?.length) return null

  return (
    <section aria-label="Building materials">
      <HomeSectionHeader
        title="Building materials"
        subtitle="Cement, steel, sand & more — delivered to site"
        actionLabel="See all"
        onAction={() => navigate('/app/buildmart')}
      />
      <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <MartCard key={p.id || p._id} product={p} />
        ))}
      </div>
    </section>
  )
}
