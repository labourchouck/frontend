import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { AppListSkeleton } from '../../app-ui/feedback/AppListSkeleton.jsx'
import { getCategoryImageUrl } from '../../../lib/labourCategoryDisplay.js'

const FALLBACK_BOOKING_IMG =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70'

export function IndividualHomeRecentlyBooked({ bookings, loading, formatDay }) {
  if (loading) {
    return (
      <section className="mb-6" aria-label="Recently booked">
        <div className="lc-home-section-head">
          <h3>Recently booked</h3>
        </div>
        <AppListSkeleton rows={1} className="h-44" />
      </section>
    )
  }

  if (!bookings?.length) {
    return null
  }

  return (
    <section className="mb-6" aria-label="Recently booked">
      <div className="lc-home-section-head">
        <h3>Recently booked</h3>
        <Link to="/app/bookings" className="lc-home-view-all">
          View all &gt;
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {bookings.map((b) => {
          const primaryLine = (b.lines || [])[0]
          const itemLabel = primaryLine?.categoryName || 'Labour booking'
          const day = formatDay(b.serviceDate)
          const img = primaryLine?.categoryId
            ? getCategoryImageUrl({ _id: primaryLine.categoryId, name: itemLabel })
            : FALLBACK_BOOKING_IMG

          return (
            <Link
              key={b.id || b.ref}
              to={`/app/bookings?ref=${encodeURIComponent(b.ref || '')}`}
              className="lc-home-service-card snap-start"
            >
              <img src={img} alt="" className="lc-home-service-card-img" loading="lazy" />
              <div className="lc-home-service-card-body">
                <div className="flex items-start justify-between gap-1">
                  <p className="line-clamp-1 text-sm font-bold text-slate-900">{itemLabel}</p>
                  <span className="shrink-0 text-xs font-bold text-brand">View</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500">
                  {day} · Site booking
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                  Active request
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
