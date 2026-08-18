import { Link } from 'react-router-dom'
import { ArrowLeft, Menu } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel.jsx'

function openAppDrawer() {
  window.dispatchEvent(new Event('lc-open-app-drawer'))
}

/**
 * Standard header for full-screen app routes without AppShell chrome (bookings, search, etc.).
 */
export function AppStackScreenHeader({ title, backTo = '/app', onBack }) {
  return (
    <header className="sticky top-0 z-30 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
      <GlassPanel className="flex items-center gap-3 px-3 py-2.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-slate-900 active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <Link
            to={backTo}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-slate-900 active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 text-lg font-extrabold tracking-tight text-slate-900 truncate">{title}</h1>
        <button
          type="button"
          onClick={openAppDrawer}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 text-slate-700 shadow-sm transition hover:border-brand/30 hover:text-slate-900 active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </GlassPanel>
    </header>
  )
}
