import { Link } from 'react-router-dom'
import { AppListSkeleton } from '../../app-ui/feedback/AppListSkeleton.jsx'
import { IndividualHomeProductCard } from './IndividualHomeProductCard.jsx'

export function IndividualHomeProductCarousel({
  title = 'Products',
  products,
  loading,
  error,
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

      {loading ? <AppListSkeleton rows={1} className="h-[320px]" /> : null}

      {!loading && !error && products.length > 0 ? (
        <>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 scroll-px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
            {products.map((p, i) => (
              <div key={p.id || p._id} className="w-[calc(50vw-22px)] sm:w-[160px] shrink-0 snap-start">
                <IndividualHomeProductCard product={p} index={i} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Link
              to="/app/buildmart"
              className="text-sm font-bold text-brand hover:underline px-2"
            >
              More products &rarr;
            </Link>
          </div>
        </>
      ) : null}
    </section>
  )
}
