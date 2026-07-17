import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Package, Truck } from 'lucide-react'
import { formatBuildMartPrice } from '../../../data/buildmartCatalog.js'

export function IndividualHomeProductCard({ product, index = 0 }) {
  const reduce = useReducedMotion()
  const primaryVariant = product.variants?.[0]

  return (
    <motion.article
      className="group overflow-hidden rounded-2xl border border-brand/20 bg-white shadow-sm ring-1 ring-slate-100/80 transition hover:shadow-md hover:border-brand/30"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      whileHover={reduce ? undefined : { y: -3 }}
    >
      <Link to={`/app/buildmart/product/${product.id || product._id}`} className="block">
        <motion.div
          className="relative aspect-[16/10] overflow-hidden bg-slate-100"
          whileHover={reduce ? undefined : { scale: 1.02 }}
          transition={{ duration: 0.35 }}
        >
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
          <span className="absolute left-2 top-2 max-w-[calc(100%-16px)] truncate rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-brand ring-1 ring-brand/20">
            {product.brand}
          </span>
        </motion.div>

        <motion.div className="flex flex-col h-[130px] p-2.5">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-tight tracking-tight text-slate-900">
            {product.name}
          </h3>

          <div className="mt-auto pt-1 space-y-1.5">
            <span className="block text-sm font-black text-brand">
              {primaryVariant
                ? formatBuildMartPrice(primaryVariant.retailPrice, primaryVariant.unit)
                : product.priceLabel}
            </span>

            <p className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
              <Truck className="h-3 w-3 shrink-0 text-brand" aria-hidden />
              <span className="truncate">{product.deliveryInfo}</span>
            </p>

            <span className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-brand/20 bg-gradient-to-r from-brand/5 to-white py-1.5 text-xs font-extrabold text-brand transition group-hover:border-brand/30 group-hover:from-brand/10">
              View Details
              <ChevronRight className="h-3 w-3" aria-hidden />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.article>
  )
}
