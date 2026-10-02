import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ZoomIn } from 'lucide-react'

export function BuildMartImageCarousel({ images = [], productName, badge = null }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const src = images[index] || images[0]

  return (
    <div className="space-y-2.5">
      <motion.button
        type="button"
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#f1f6f5] ring-1 ring-slate-200/70"
        onClick={() => setZoomed((z) => !z)}
        whileTap={reduce ? undefined : { scale: 0.99 }}
        aria-label={zoomed ? 'Close zoom' : 'Zoom image'}
      >
        <motion.img
          key={`${src}-${zoomed}`}
          src={src}
          alt={productName}
          className="h-full w-full object-contain"
          animate={zoomed ? { scale: 1.35 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          drag={!reduce ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (images.length < 2) return
            if (info.offset.x < -60) setIndex((i) => (i + 1) % images.length)
            else if (info.offset.x > 60) setIndex((i) => (i - 1 + images.length) % images.length)
          }}
        />
        {badge ? <span className="absolute left-3 top-3">{badge}</span> : null}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
          <ZoomIn className="h-3 w-3" aria-hidden />
          {zoomed ? 'Tap to reset' : 'Tap to zoom'}
        </span>
        {images.length > 1 ? (
          <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((img, i) => (
              <span
                key={img}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-brand' : 'w-1.5 bg-white/80'}`}
              />
            ))}
          </span>
        ) : null}
      </motion.button>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => {
                setIndex(i)
                setZoomed(false)
              }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === index ? 'ring-brand' : 'ring-transparent opacity-70'
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
