import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassPanel } from '../../ui/GlassPanel.jsx'

/**
 * Presentational bottom tab bar for `AppShell` — supports premium BuildMart tab styling.
 * @param {{ items: { id: string, to: string, end?: boolean, label: string, icon: import('lucide-react').LucideIcon, premium?: boolean }[] }} props
 */
export function AppBottomNav({ items }) {
  const reduce = useReducedMotion()

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3"
      style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
      aria-label="Bottom navigation"
    >
      <GlassPanel className="pointer-events-auto mb-1 flex w-full max-w-[min(100%,28rem)] items-end gap-0.5 px-1.5 py-1.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(255,255,255,0.5)_inset]">
        {items.map(({ id, to, end, label, icon: Icon, premium }) => (
          <NavLink
            key={`${id}-${to}`}
            to={to}
            end={Boolean(end)}
            className={`flex min-w-0 flex-col items-center justify-center rounded-xl outline-none transition ${
              premium ? 'relative -mt-3 flex-[1.15]' : 'flex-1 py-1.5'
            }`}
          >
            {({ isActive }) =>
              premium ? (
                <>
                  <motion.span
                    className="relative flex items-center justify-center"
                    animate={
                      reduce
                        ? undefined
                        : isActive
                          ? { scale: [1, 1.06, 1], y: [0, -2, 0] }
                          : { scale: 1, y: 0 }
                    }
                    transition={
                      isActive
                        ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                        : { type: 'spring', stiffness: 400, damping: 28 }
                    }
                  >
                    {isActive && !reduce ? (
                      <motion.span
                        layoutId="app-tab-premium-highlight"
                        className="absolute -inset-1 rounded-2xl buildmart-gradient buildmart-glow ring-2 ring-orange-300/40"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    {isActive && reduce ? (
                      <span className="absolute -inset-1 rounded-2xl buildmart-gradient ring-2 ring-orange-300/40" />
                    ) : null}
                    {!isActive ? (
                      <span className="absolute -inset-0.5 rounded-2xl bg-white ring-1 ring-orange-200/80 shadow-md" />
                    ) : null}
                    <span
                      className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-xl ${
                        isActive ? 'text-white' : 'text-bm-terracotta'
                      }`}
                    >
                      <Icon className="h-[22px] w-[22px]" aria-hidden />
                    </span>
                  </motion.span>
                  <span
                    className={`mt-1 truncate px-0.5 text-[10px] font-black tracking-wide ${
                      isActive ? 'text-bm-terracotta' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-10 w-10 items-center justify-center">
                    {isActive && !reduce ? (
                      <motion.span
                        layoutId="app-tab-highlight"
                        className="absolute inset-0 rounded-xl bg-linear-to-br from-brand/25 via-brand-muted/50 to-white shadow-[0_4px_16px_-4px_rgba(28,175,98,0.35)] ring-1 ring-brand/25"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    {isActive && reduce ? (
                      <span className="absolute inset-0 rounded-xl bg-linear-to-br from-brand/25 to-brand-muted/50 ring-1 ring-brand/25" />
                    ) : null}
                    <Icon
                      className={`relative z-10 h-[22px] w-[22px] ${isActive ? 'text-brand' : 'text-slate-400'}`}
                      aria-hidden
                    />
                  </span>
                  <span
                    className={`mt-0.5 truncate px-0.5 text-[10px] font-bold tracking-wide ${isActive ? 'text-brand' : 'text-slate-400'}`}
                  >
                    {label}
                  </span>
                </>
              )
            }
          </NavLink>
        ))}
      </GlassPanel>
    </nav>
  )
}
