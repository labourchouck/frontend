import { Link, useLocation } from 'react-router-dom'
import { Truck, Star, Layers } from 'lucide-react'
import { formatBuildMartPrice, getBuildMartOffer } from '../../data/buildmartCatalog.js'

/**
 * Quick-commerce style product tile for the user BuildMart (home rails and
 * category grids). `rail` gives it a fixed width for horizontal scrollers.
 */
export function MartProductTile({ product, rail = false }) {
  const { pathname } = useLocation()
  const basePath = pathname.startsWith('/corporate/mart') ? '/corporate/mart' : '/app/buildmart'
  const primaryVariant = product.variants?.[0]
  const imageUrl = product.images?.[0] || product.image
  const offer = getBuildMartOffer(primaryVariant)
  const price =
    primaryVariant && primaryVariant.retailPrice != null
      ? formatBuildMartPrice(primaryVariant.retailPrice, primaryVariant.unit)
      : product.priceLabel || 'Price on request'

  return (
    <Link
      to={`${basePath}/product/${product.id || product._id}`}
      className={`group flex flex-col ${rail ? 'w-[150px] shrink-0 snap-start' : ''}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#f1f6f5] ring-1 ring-slate-200/60">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
        )}

        {offer.hasOffer ? (
          <span className="absolute left-0 top-2 rounded-r-md bg-brand px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
            {offer.discountPercent}% OFF
          </span>
        ) : null}
        {product.variantCount > 1 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 shadow-sm">
            <Layers className="h-2.5 w-2.5" aria-hidden />
            {product.variantCount} sizes
          </span>
        ) : null}
        <span className="absolute bottom-2 right-2 rounded-lg border border-brand bg-white px-2.5 py-0.5 text-[11px] font-black tracking-wide text-brand shadow-[0_4px_10px_-4px_rgba(15,23,42,0.4)] transition group-hover:bg-brand group-hover:text-white">
          VIEW
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px]">
        {product.brand ? (
          <span className="truncate font-bold uppercase tracking-wide text-slate-500">{product.brand}</span>
        ) : null}
        {product.supplier?.rating ? (
          <span className="ml-auto flex shrink-0 items-center gap-0.5 font-bold text-amber-600">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden />
            {product.supplier.rating}
          </span>
        ) : null}
      </div>
      <h3 className="mt-0.5 line-clamp-2 min-h-[2.4em] text-[12.5px] font-bold leading-snug text-slate-900">
        {product.name}
      </h3>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[14px] font-black text-slate-900">{price}</span>
        {offer.hasOffer ? (
          <span className="text-[10px] font-semibold text-slate-400 line-through">{offer.mrpLabel}</span>
        ) : null}
      </div>
      {product.deliveryInfo ? (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <Truck className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{product.deliveryInfo}</span>
        </p>
      ) : null}
    </Link>
  )
}
