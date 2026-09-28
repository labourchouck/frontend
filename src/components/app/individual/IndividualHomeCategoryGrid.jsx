import { ChevronRight } from 'lucide-react'
import { getGroupImageUrl } from '../../../lib/labourCategoryDisplay.js'

export function IndividualHomeCategoryGrid({
  groups = [],
  loading = false,
  onSelectCategory,
  title = 'Categories',
  emptyAction = 'Find a skill',
  onEmptyAction,
}) {
  const categories = groups || []

  if (loading) {
    return (
      <section className="space-y-3" aria-label={title}>
        <div className="lc-home-section-head">
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 animate-pulse rounded-md bg-slate-200" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </section>
    )
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section className="space-y-3" aria-label={title}>
      <div className="lc-home-section-head flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            {title}
          </h3>
        </div>
        {onEmptyAction ? (
          <button
            type="button"
            onClick={onEmptyAction}
            className="flex items-center gap-0.5 text-xs sm:text-sm font-bold text-brand transition-colors hover:text-brand-dark active:scale-95"
          >
            {emptyAction}
            <ChevronRight className="h-4 w-4 shrink-0 text-brand" />
          </button>
        ) : (
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {categories.length} {categories.length === 1 ? 'skill' : 'skills'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const imageUrl = getGroupImageUrl(cat)

          return (
            <button
              key={String(cat._id)}
              type="button"
              onClick={() => onSelectCategory?.(cat)}
              className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 text-left shadow-[0_6px_18px_-10px_rgba(15,23,42,0.35)] outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_-12px_rgba(15,23,42,0.4)] active:scale-95 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              aria-label={cat.name}
            >
              <img
                src={imageUrl}
                alt=""
                className="lc-img-reveal h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onLoad={(e) => e.currentTarget.classList.add('lc-img-loaded')}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-2.5 text-left text-[11px] font-bold leading-tight text-white drop-shadow-sm sm:text-xs">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
