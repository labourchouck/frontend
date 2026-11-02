import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Self-dismissing toast floating above the bottom nav.
 * @param {{ banner: { variant: 'success' | 'error', message: string } | null, onDismiss: () => void, duration?: number }} props
 */
export function BannerToast({ banner, onDismiss, duration = 3200 }) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!banner) return undefined
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [banner, onDismiss, duration])

  return (
    <AnimatePresence>
      {banner ? (
        <motion.div
          key={banner.message}
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 8 }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] z-120 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10 ${
              banner.variant === 'success' ? 'bg-emerald-700' : 'bg-rose-700'
            }`}
          >
            {banner.variant === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>{banner.message}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
