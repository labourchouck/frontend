import { Star } from 'lucide-react'
import { AppListSkeleton } from '../../app-ui/feedback/AppListSkeleton.jsx'
import { hashSeed } from '../../../lib/discoverLabourDummyUi.js'

export function IndividualHomeWorkerCarousel({
  title = 'Nearby labour',
  workers,
  loading,
  error,
  emptyAction,
  onSelectWorker,
  onEmptyAction,
}) {
  return (
    <section className="mb-6" aria-label={title}>
      <div className="lc-home-section-head">
        <h3>{title}</h3>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900">
          {error}
        </p>
      ) : null}

      {loading ? <AppListSkeleton rows={1} className="h-44" /> : null}

      {!loading && !error && workers.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 px-4 py-12 text-center shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80"
            alt="No workers background"
            className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale mix-blend-multiply"
          />
          {/* Subtle gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 via-slate-100/40 to-transparent" />
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-base font-bold text-slate-900 drop-shadow-sm">No workers in this area yet</p>
            {emptyAction ? (
              <button
                type="button"
                onClick={onEmptyAction}
                className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                {emptyAction}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!loading && workers.length > 0 ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {workers.map((l) => {
            const ui = l._ui
            const firstCat = (l.tradeCategories || [])[0]
            const dayRate = 380 + hashSeed(String(l.id), 220)
            const reviewCount = ui.ratingCount >= 1000 ? `${(ui.ratingCount / 1000).toFixed(1)}K` : ui.ratingCount

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelectWorker?.(l.id)}
                className="lc-home-service-card snap-start"
              >
                <img src={ui.photoUrl} alt="" className="lc-home-service-card-img" loading="lazy" />
                <div className="lc-home-service-card-body">
                  <div className="flex items-start justify-between gap-1">
                    <p className="line-clamp-1 text-sm font-bold text-slate-900">{firstCat?.name || 'Skilled worker'}</p>
                    <span className="shrink-0 text-xs font-bold text-slate-900">₹{dayRate}/day</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500">{l.displayName}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                    {ui.rating.toFixed(1)} ({reviewCount} reviews)
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
