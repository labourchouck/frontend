import { Plus, Star, Zap } from 'lucide-react'
import { getGroupImageUrl } from '../../../lib/labourCategoryDisplay.js'
import { hashSeed } from '../../../lib/discoverLabourDummyUi.js'

/** Deterministic demo price/rating per category, styled after the "quick services" mock. */
function quickServiceUi(cat) {
  const seed = String(cat._id || cat.name || 'svc')
  const rating = Math.round((4.5 + (hashSeed(seed, 50) / 100) * 0.5) * 10) / 10
  const reviewsRaw = 800 + hashSeed(seed + 'r', 18000)
  const reviews = reviewsRaw >= 1000 ? `${(reviewsRaw / 1000).toFixed(1)}k` : String(reviewsRaw)
  const original = 149 + hashSeed(seed + 'p', 8) * 25
  const discount = 40 + hashSeed(seed + 'd', 30)
  const price = Math.max(49, Math.round((original * (100 - discount)) / 100 / 10) * 10)
  return { rating, reviews, original, price }
}

export function IndividualHomeQuickServicesGrid({ groups = [], loading = false, onSelectCategory }) {
  if (loading) {
    return (
      <section className="space-y-3" aria-label="Quick Labor Services">
        <div className="h-5 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </section>
    )
  }

  if (!groups || groups.length === 0) return null

  return (
    <section className="space-y-3" aria-label="Quick Labor Services">
      <div>
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">Quick Labor Services</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
          At your location in <span className="text-brand">15 mins</span>
          <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {groups.slice(0, 6).map((cat) => {
          const imageUrl = getGroupImageUrl(cat)
          const { rating, reviews, original, price } = quickServiceUi(cat)
          return (
            <button
              key={String(cat._id)}
              type="button"
              onClick={() => onSelectCategory?.(cat)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-xs outline-none transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand active:scale-95"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                <img
                  src={imageUrl}
                  alt={cat.name}
                  className="h-full w-full object-cover scale-[1.1] transition-transform duration-300 group-hover:scale-[1.16]"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden />
                  {rating}
                  <span className="font-medium text-slate-400">({reviews})</span>
                </span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-hidden
                  className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-lg transition group-hover:scale-110 group-active:scale-95"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <div className="space-y-1 p-2.5 pb-3">
                <p className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-800">{cat.name}</p>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-slate-900">₹{price}</span>
                  <span className="text-[10px] font-semibold text-slate-400 line-through">₹{original}</span>
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
