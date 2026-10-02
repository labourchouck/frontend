import { useMemo, useState, useEffect } from 'react'
import { Navigate, useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, ChevronRight, Loader2, MapPin, Package, Star, Truck } from 'lucide-react'
import { BuildMartImageCarousel } from '../../../components/buildmart/BuildMartImageCarousel.jsx'
import { BuildMartVariantPicker } from '../../../components/buildmart/BuildMartVariantPicker.jsx'
import { MartProductTile } from '../../../components/buildmart/MartProductTile.jsx'
import { BuildMartRequestQuoteSheet } from '../../../components/buildmart/BuildMartRequestQuoteSheet.jsx'
import { formatBuildMartPrice, getBuildMartOffer } from '../../../data/buildmartCatalog.js'
import { fetchAppMartProducts } from '../../../api/buildmartApi.js'

const AVAILABILITY = {
  in_stock: { label: 'In stock', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  limited: { label: 'Limited stock', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  preorder: { label: 'Pre-order', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
}

export function BuildMartProductPage() {
  const { productId } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const basePath = pathname.includes('/corporate/mart') ? '/corporate/mart' : '/app/buildmart'

  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [variantId, setVariantId] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchAppMartProducts()
      .then((res) => {
        if (!cancelled) setAllProducts(res?.data ?? res ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const product = useMemo(
    () => allProducts.find((p) => (p.id || p._id) === productId) || null,
    [allProducts, productId],
  )

  // Selected variant falls back to the first one until the shopper picks another.
  const variant = useMemo(
    () => (product?.variants || []).find((v) => v.id === variantId) ?? product?.variants?.[0],
    [product, variantId],
  )
  const offer = useMemo(() => getBuildMartOffer(variant), [variant])

  const related = useMemo(() => {
    if (!product) return []
    const id = product.id || product._id
    const explicit = product.relatedIds?.length
      ? allProducts.filter((p) => product.relatedIds.includes(p.id || p._id))
      : []
    if (explicit.length) return explicit
    return allProducts.filter((p) => p.categoryId === product.categoryId && (p.id || p._id) !== id).slice(0, 8)
  }, [product, allProducts])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden />
      </div>
    )
  }

  if (!product) return <Navigate to={basePath} replace />

  const avail = AVAILABILITY[product.availability] || AVAILABILITY.in_stock
  const unit = variant?.unit
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(basePath))

  return (
    <motion.div
      className="-mx-4 -mt-4 min-h-screen bg-white pb-10 sm:mx-0 sm:mt-0"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-white/95 px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur">
        <button
          type="button"
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900">{product.name}</p>
      </header>

      <div className="space-y-5 px-4 pt-3">
        <BuildMartImageCarousel
          images={product.images || []}
          productName={product.name}
          badge={
            offer.hasOffer ? (
              <span className="rounded-lg bg-brand px-2 py-1 text-[11px] font-black text-white shadow-sm">
                {offer.discountPercent}% OFF
              </span>
            ) : null
          }
        />

        {/* Title + price */}
        <section>
          <div className="flex flex-wrap items-center gap-2">
            {product.brand ? (
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{product.brand}</span>
            ) : null}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${avail.className}`}>{avail.label}</span>
            {product.supplier?.rating ? (
              <span className="ml-auto flex items-center gap-0.5 text-xs font-bold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {product.supplier.rating}
              </span>
            ) : null}
          </div>
          <h1 className="mt-1.5 text-xl font-black leading-snug tracking-tight text-slate-900">{product.name}</h1>

          {variant ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-black text-slate-900">{formatBuildMartPrice(variant.retailPrice, unit)}</span>
              {offer.hasOffer ? (
                <>
                  <span className="text-sm font-semibold text-slate-400 line-through">{offer.mrpLabel}</span>
                  <span className="text-sm font-extrabold text-brand">{offer.discountPercent}% off</span>
                </>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-lg font-black text-slate-900">{product.priceLabel || 'Price on request'}</p>
          )}

          {variant && (variant.contractorPrice || variant.bulkPrice || variant.moq) ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {variant.contractorPrice ? (
                <PriceChip label="Contractor" value={formatBuildMartPrice(variant.contractorPrice, unit)} highlight />
              ) : null}
              {variant.bulkPrice ? <PriceChip label="Bulk" value={formatBuildMartPrice(variant.bulkPrice, unit)} /> : null}
              {variant.moq ? <PriceChip label="Min. order" value={`${variant.moq} ${unit || ''}`.trim()} /> : null}
            </div>
          ) : null}
        </section>

        {product.variants?.length > 1 ? (
          <section>
            <h2 className="mb-2 text-sm font-extrabold text-slate-900">
              Choose size <span className="font-semibold text-slate-400">· {product.variants.length} options</span>
            </h2>
            <BuildMartVariantPicker variants={product.variants} selectedId={variant?.id} onSelect={setVariantId} />
          </section>
        ) : null}

        {/* Delivery + supplier */}
        <section className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200/80">
          {product.deliveryInfo ? (
            <div className="flex items-start gap-3 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                <Truck className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Delivery</p>
                <p className="text-xs leading-relaxed text-slate-600">{product.deliveryInfo}</p>
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-3 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
              <Package className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{product.supplier?.name || 'Local supplier'}</p>
              <p className="flex items-center gap-2 text-xs text-slate-500">
                {product.supplier?.city ? (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {product.supplier.city}
                  </span>
                ) : null}
                <span className="flex items-center gap-0.5 font-bold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Verified supplier
                </span>
              </p>
            </div>
          </div>
        </section>

        {product.description ? (
          <section>
            <h2 className="mb-1.5 text-sm font-extrabold text-slate-900">About this product</h2>
            <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
          </section>
        ) : null}

        {product.specs?.length > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-extrabold text-slate-900">Specifications</h2>
            <dl className="overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
              {product.specs.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex justify-between gap-4 px-3.5 py-2.5 text-sm ${i % 2 ? 'bg-white' : 'bg-slate-50/80'}`}
                >
                  <dt className="font-medium text-slate-500">{s.label}</dt>
                  <dd className="text-right font-bold text-slate-900">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section>
            <h2 className="mb-2 text-base font-extrabold tracking-tight text-slate-900">You may also need</h2>
            <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {related.map((p) => (
                <MartProductTile key={p.id || p._id} product={p} rail />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Sticky action bar above the bottom nav */}
      {/* Sits flush on the bottom nav: 75px of content + its max(0.5rem, safe-area) bottom padding. */}
      <div className="fixed inset-x-0 bottom-[calc(75px+max(0.5rem,env(safe-area-inset-bottom,0px)))] z-20 border-t border-slate-200/80 bg-white shadow-[0_-8px_20px_-14px_rgba(15,23,42,0.35)]">
        <motion.div
          className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5"
          initial={reduce ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-slate-500">{variant?.label || 'Price'}</p>
            <p className="truncate text-base font-black text-slate-900">
              {variant ? formatBuildMartPrice(variant.retailPrice, unit) : product.priceLabel || 'On request'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98]"
          >
            Request quote
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </motion.div>
      </div>

      <BuildMartRequestQuoteSheet
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        product={product}
        variant={variant}
      />
    </motion.div>
  )
}

function PriceChip({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl px-2.5 py-2 ring-1 ${highlight ? 'bg-emerald-50 ring-emerald-200' : 'bg-slate-50 ring-slate-200/80'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 break-words text-[12.5px] font-extrabold leading-tight ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}
