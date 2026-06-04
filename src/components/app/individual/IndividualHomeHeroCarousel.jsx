import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const SLIDES = [
  {
    id: 'promo',
    badge: 'Verified workers',
    title: 'Save time on every site visit',
    subtitle: 'Book masons, electricians & more — instant or scheduled.',
    cta: 'Book now',
    action: 'search',
    image:
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'emergency',
    badge: 'Emergency',
    title: 'Need labour urgently?',
    subtitle: 'Fast matching within 30 minutes.',
    cta: 'Hire now',
    action: 'search',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'buildmart',
    badge: 'BuildMart',
    title: 'Materials for your site',
    subtitle: 'Cement, sand & steel from nearby suppliers.',
    cta: 'Explore',
    action: 'buildmart',
    image:
      'https://images.unsplash.com/photo-1581094797760-3c2f8f4e3b0a?auto=format&fit=crop&w=900&q=80',
  },
]

export function IndividualHomeHeroCarousel({ onBook }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [])

  const slide = SLIDES[index]

  function handleCta() {
    if (slide.action === 'buildmart') {
      navigate('/app/buildmart')
      return
    }
    onBook?.()
  }

  return (
    <section aria-label="Offers" className="mb-1">
      <article className="lc-home-hero-slide">
        <img
          key={slide.id}
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
        <div className="relative flex min-h-[inherit] flex-col justify-end p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wide">{slide.badge}</p>
          <h2 className="mt-1.5 max-w-[16rem] text-lg font-extrabold leading-snug tracking-tight">
            {slide.title}
          </h2>
          <p className="mt-1 max-w-[14rem] text-xs leading-relaxed">{slide.subtitle}</p>
          <button
            type="button"
            onClick={handleCta}
            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-md transition active:scale-[0.98] hover:brightness-105"
          >
            {slide.cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </article>

      <div className="lc-home-hero-dots" role="tablist" aria-label="Promo slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
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
    </section>
  )
}
