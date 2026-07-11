import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { fetchActiveBanners } from '../../../api/bannersApi.js'

export function IndividualHomeHeroCarousel({ onBook }) {
  const [index, setIndex] = useState(0)
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchActiveBanners()
      .then((res) => {
        if (!cancelled) {
          setBanners(res.data?.banners ?? [])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [banners.length])

  if (loading) {
    return (
      <section className="mb-1 animate-pulse">
        <article className="lc-home-hero-slide bg-slate-200" />
      </section>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const slide = banners[index] || banners[0]

  return (
    <section aria-label="Offers" className="mb-1">
      <article className="lc-home-hero-slide">
        <img
          key={slide._id}
          src={slide.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* We removed the text overlay because admin will upload visual banners directly */}
      </article>

      {banners.length > 1 && (
        <div className="lc-home-hero-dots" role="tablist" aria-label="Promo slides">
          {banners.map((s, i) => (
            <button
              key={s._id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className="lc-home-hero-dot"
              data-active={i === index ? 'true' : 'false'}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
