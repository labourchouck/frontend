import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchAppMartBanners } from '../../api/buildmartApi.js'

export function BuildMartPromoBanner() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
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
        className="flex w-full snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {banners.map((banner) => {
          const content = (
            <>
              {/* Background Image */}
              <img 
                src={banner.image || banner.imageUrl} 
                alt={banner.title || 'Promo Banner'} 
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" 
              />
              
              {/* Subtle Gradient Overlay for text readability (no colors) */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" 
              />

              {/* Text Content */}
              <div className="relative flex h-full w-full flex-col justify-center p-5 text-white z-10">
                {banner.title && (
                  <h3 className="mb-1 text-xl font-black leading-tight tracking-tight drop-shadow-md">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="mb-4 max-w-[75%] text-xs font-semibold text-white/90 drop-shadow">
                    {banner.subtitle}
                  </p>
                )}
                {banner.cta && (
                  <div className="mt-auto self-start rounded-lg bg-white px-4 py-1.5 text-xs font-extrabold text-slate-900 shadow-sm transition hover:bg-slate-100 group-hover:scale-105 group-hover:shadow-md">
                    {banner.cta}
                  </div>
                )}
              </div>
            </>
          )

          const containerClass = "group relative w-full min-w-full shrink-0 snap-center overflow-hidden rounded-[1.25rem] bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.08)] aspect-[16/9]"

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
    </div>
  )
}
