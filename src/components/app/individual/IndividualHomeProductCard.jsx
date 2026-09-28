import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Truck } from 'lucide-react'
import { formatBuildMartPrice, getBuildMartOffer } from '../../../data/buildmartCatalog.js'

export function IndividualHomeProductCard({ product, index = 0 }) {
  const reduce = useReducedMotion()
  const primaryVariant = product.variants?.[0]
  const offer = getBuildMartOffer(primaryVariant)

  return (
    <motion.article
      className="group overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 transition hover:shadow-[0_10px_28px_-10px_rgba(15,23,42,0.22)]"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      whileHover={reduce ? undefined : { y: -3 }}
    >
      <Link to={`/app/buildmart/product/${product.id || product._id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <motion.img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full object-contain p-3"
            loading="lazy"
            whileHover={reduce ? undefined : { scale: 1.05 }}
            transition={{ duration: 0.35 }}
          />
          <span className="absolute left-2 top-2 max-w-[calc(100%-16px)] truncate rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-brand shadow-sm ring-1 ring-brand/20">
            {product.brand}
          </span>
          {offer.hasOffer ? (
            <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
              {offer.discountPercent}% OFF
            </span>
          ) : null}
        </div>

        <div className="flex h-[142px] flex-col p-3">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-tight tracking-tight text-slate-900">
            {product.name}
          </h3>

          <div className="mt-auto space-y-2 pt-1.5">
            <span className="flex items-baseline gap-1.5">
              <span className="block text-base font-black text-slate-900">
                {primaryVariant
                  ? formatBuildMartPrice(primaryVariant.retailPrice, primaryVariant.unit)
                  : product.priceLabel}
              </span>
              {offer.hasOffer ? (
                <span className="text-[10px] font-semibold text-slate-400 line-through">{offer.mrpLabel}</span>
              ) : null}
            </span>

            <p className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
              <Truck className="h-3 w-3 shrink-0 text-brand" aria-hidden />
              <span className="truncate">{product.deliveryInfo}</span>
            </p>

            <span className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-brand py-2 text-xs font-extrabold text-white shadow-sm shadow-brand/30 transition group-hover:brightness-95">
              View Details
              <ChevronRight className="h-3 w-3" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
