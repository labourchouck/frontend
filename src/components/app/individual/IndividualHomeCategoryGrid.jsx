import { useMemo } from 'react'
import { LayoutGrid, Sparkles, ChevronRight, Star } from 'lucide-react'
import { getGroupImageUrl } from '../../../lib/labourCategoryDisplay.js'

// Simple deterministic hash for UI dummy data
function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

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
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-slate-200 shadow-xs" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            </div>
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
              className="group flex flex-col w-full rounded-2xl bg-white border border-slate-100 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-brand overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-brand/40 active:scale-95"
              aria-label={cat.name}
            >
              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={cat.name}
                  className="lc-img-reveal h-full w-full object-cover scale-[1.15] transition-transform duration-300 group-hover:scale-[1.20]"
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => e.currentTarget.classList.add('lc-img-loaded')}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>
              
              <div className="flex flex-col items-start p-2.5 pb-3 w-full bg-white">
                <span className="line-clamp-2 text-left text-[11px] sm:text-xs font-bold leading-tight text-slate-800 transition-colors group-hover:text-brand">
                  {cat.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
