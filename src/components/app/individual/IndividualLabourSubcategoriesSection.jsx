import { motion, useReducedMotion } from 'framer-motion'
import { Loader2, Wrench } from 'lucide-react'
import { GlassPanel } from '../../ui/GlassPanel.jsx'
import { getCategoryImageUrl } from '../../../lib/labourCategoryDisplay.js'

export function IndividualLabourSubcategoriesSection({ subcategories, loading, onSelect, onQuickBook }) {
  const reduce = useReducedMotion()

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="space-y-3"
      aria-labelledby="home-subcategories-heading"
    >
      <motion.div layout className="px-0.5">
        <h3 id="home-subcategories-heading" className="text-base font-extrabold tracking-tight text-slate-900">
          Book by skill
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">Tap for instant or scheduled booking</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden />
          Loading skills…
        </div>
      ) : null}

      {!loading && subcategories.length === 0 ? (
        <GlassPanel className="border-dashed border-slate-200/90 p-6 text-center">
          <Wrench className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-slate-700">Skills catalogue loading soon</p>
        </GlassPanel>
      ) : null}

      {!loading && subcategories.length > 0 ? (
        <div className="-mx-1 grid grid-cols-4 gap-2.5 sm:grid-cols-4 md:gap-3">
          {subcategories.slice(0, 16).map((cat, idx) => {
            const img = getCategoryImageUrl(cat)

            const inner = (
              <>
                <span className="relative h-[4.25rem] w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/25 to-transparent" aria-hidden />
                </span>
                <span className="line-clamp-2 min-h-[2.25rem] w-full text-center text-[10px] font-bold leading-tight text-slate-800">
                  {cat.name}
                </span>
              </>
            )

            return (
              <motion.div
                key={String(cat._id)}
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, delay: Math.min(idx * 0.02, 0.2) }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(cat)
                    onQuickBook?.(cat)
                  }}
                  className="group flex w-full flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm ring-1 ring-slate-100/90 transition hover:border-brand/30 hover:shadow-md active:scale-[0.98]"
                >
                  {inner}
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : null}
    </motion.section>
  )
}
