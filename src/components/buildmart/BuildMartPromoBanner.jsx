import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { fetchAppMartBanners } from '../../api/buildmartApi.js'

export function BuildMartPromoBanner() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    fetchAppMartBanners()
      .then((res) => {
        const data = res?.data ?? res ?? []
        setBanners(data.filter(b => b.active !== false))
      })
      .catch((err) => console.error('Failed to load banners:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      if (!scrollRef.current) return
      
      const el = scrollRef.current
      const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
      
      if (isAtEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: el.clientWidth, behavior: 'smooth' })
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [banners.length])

  if (loading) {
    return (
      <div className="mx-4 mt-2 h-40 animate-pulse rounded-[1.25rem] bg-slate-100" />
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <div className="mt-2 w-full px-4">
      <div 
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          setActive(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)))
        }}
        className="flex w-full snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {banners.map((banner) => {
          const content = (
            <>
              {/* Photo, anchored right so the product stays clear of the text block */}
              <img
                src={banner.image || banner.imageUrl}
                alt={banner.title || 'Promo Banner'}
                className="absolute inset-0 h-full w-full object-cover object-[70%_center] transition duration-700 group-hover:scale-105"
              />

              {/* Readability: deep scrim on the left, fading out by ~65% width */}
              <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/55 via-45% to-transparent to-70%" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-slate-950/40 to-transparent" />

              <div className="relative z-10 flex h-full w-[62%] flex-col justify-center px-4 pb-3 pt-4 text-white">
                {banner.title && (
                  <h3 className="line-clamp-2 text-[19px] font-black leading-[1.15] tracking-tight drop-shadow-md">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-white/85 drop-shadow">
                    {banner.subtitle}
                  </p>
                )}
                {banner.cta && (
                  <span className="mt-5 inline-flex w-fit items-center gap-1 rounded-lg bg-white/15 px-3.5 py-1.5 text-xs font-extrabold text-white ring-1 ring-white/35 backdrop-blur-md transition-all duration-200 hover:bg-brand hover:ring-brand group-hover:gap-1.5 group-hover:bg-brand group-hover:ring-brand group-hover:shadow-[0_6px_16px_-6px_rgba(16,185,129,0.8)]">
                    {banner.cta}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}
              </div>
            </>
          )

          const containerClass = "group relative w-full min-w-full shrink-0 snap-center overflow-hidden rounded-[1.25rem] bg-slate-900 aspect-[2/1]"

          return banner.categoryId ? (
            <Link 
              key={banner.id || banner._id} 
              to={`/app/buildmart/category/${banner.categoryId}`}
              className={containerClass}
            >
              {content}
            </Link>
          ) : (
            <div 
              key={banner.id || banner._id} 
              className={containerClass}
            >
              {content}
            </div>
          )
        })}
      </div>
      {banners.length > 1 ? (
        <div className="mb-1 flex justify-center gap-1.5" aria-hidden>
          {banners.map((b, i) => (
            <span
              key={b.id || b._id || i}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-brand' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
