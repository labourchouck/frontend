import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { GlassPanel } from './GlassPanel.jsx'

/**
 * Fixed top bar for full-screen panel pages (same glass style as the other stack screens).
 * Renders a spacer so page content starts below it.
 */
export function FixedStackHeader({ title, backTo, badge }) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-lg bg-white px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <GlassPanel className="flex items-center gap-3 px-3 py-2.5">
          <Link
            to={backTo}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-slate-900 active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold tracking-tight text-slate-900">{title}</h1>
          {badge ? (
            <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand ring-1 ring-brand/20">
              {badge}
            </span>
          ) : null}
        </GlassPanel>
      </header>
      <div aria-hidden className="h-[calc(5rem+env(safe-area-inset-top,0px))]" />
    </>
  )
}
