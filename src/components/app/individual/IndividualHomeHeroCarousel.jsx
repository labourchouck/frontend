import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchActiveBanners } from '../../../api/bannersApi.js'

export function IndividualHomeHeroCarousel() {
  const navigate = useNavigate()
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
        <article className="lc-home-hero-slide bg-slate-200 !min-h-0 aspect-[4/1]" />
      </section>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const target = String(banners[index]?.targetUrl || '').trim()
  const openTarget = () => {
    if (target.startsWith('/')) navigate(target)
    else if (/^https?:\/\//i.test(target)) window.open(target, '_blank', 'noopener,noreferrer')
  }

  return (
    <section aria-label="Offers" className="mb-1">
      <article
        className={`lc-home-hero-slide !min-h-0 !bg-slate-100 aspect-[4/1] relative overflow-hidden rounded-[1.25rem] ${
          target ? 'cursor-pointer' : ''
        }`}
        onClick={target ? openTarget : undefined}
        role={target ? 'link' : undefined}
      >
        {banners.map((b, i) => (
          <img
            key={b._id}
            src={b.imageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            decoding="async"
            aria-hidden={i !== index}
          />
        ))}
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
