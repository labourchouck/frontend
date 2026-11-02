import { useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

const DISMISS_KEY = 'lc_push_banner_dismissed'

const wasDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Asks the logged-in user (any panel) to turn on notifications, from a button so the browser shows its dialog.
 * Shown only while permission is "default"; shows unblock help once if the user previously blocked it.
 */
export function PushPermissionBanner({ loggedIn, permission, busy, onEnable }) {
  const [dismissed, setDismissed] = useState(wasDismissed)

  if (!loggedIn || dismissed) return null
  if (permission !== 'default' && permission !== 'denied') return null

  const blocked = permission === 'denied'
  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      className="keyboard-hide fixed left-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px)+var(--location-banner-h,0px))] z-[45] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
      role="region"
      aria-label="Notifications"
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${blocked ? 'bg-rose-50 text-rose-600' : 'bg-brand/10 text-brand'}`}>
          {blocked ? <BellOff className="h-5 w-5" aria-hidden /> : <Bell className="h-5 w-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-tight text-slate-900">{blocked ? 'Notifications are blocked' : 'Turn on notifications'}</p>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-600">
            {blocked
              ? 'Tap the lock icon by the address bar, set Notifications to Allow, then reload.'
              : 'Job offers and booking updates, even when the app is closed.'}
          </p>
        </div>
        {!blocked ? (
          <button
            type="button"
            onClick={onEnable}
            disabled={busy}
            className="shrink-0 self-center rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {busy ? 'Turning on…' : 'Turn on'}
          </button>
        ) : null}
        <button type="button" onClick={dismiss} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
