import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPinOff, Navigation, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { requestDeviceLocation } from '../../hooks/useAutoDetectLocation.js'
import { readAppUserLocation } from '../../lib/appUserLocationStorage.js'

export function LocationPermissionBanner({ className = '' }) {
  const { user } = useAuth()
  const [locStatus, setLocStatus] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const handleStatus = (e) => {
      const detail = e.detail || {}
      if (detail.status === 'success') {
        setLocStatus(null)
        setDismissed(false)
      } else if (detail.status === 'location_off' || detail.status === 'permission_denied') {
        setLocStatus(detail)
      }
    }

    window.addEventListener('lc-location-status-changed', handleStatus)
    return () => window.removeEventListener('lc-location-status-changed', handleStatus)
  }, [])

  const gpsOff = locStatus?.status === 'location_off'

  // While GPS is switched off, quietly retry so the banner disappears by itself once the user turns it on.
  useEffect(() => {
    if (!gpsOff || dismissed) return undefined
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') requestDeviceLocation(user?.role)
    }, 5000)
    return () => clearInterval(id)
  }, [gpsOff, dismissed, user?.role])

  const visible = !dismissed && Boolean(locStatus)

  // Tell other floating banners (e.g. the notifications prompt) how much room this one takes, so they stack above it.
  useEffect(() => {
    const root = document.documentElement
    const node = boxRef.current
    if (!visible || !node) {
      root.style.removeProperty('--location-banner-h')
      return undefined
    }
    const update = () => root.style.setProperty('--location-banner-h', `${Math.ceil(node.getBoundingClientRect().height) + 8}px`)
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(node)
    return () => {
      ro?.disconnect()
      root.style.removeProperty('--location-banner-h')
    }
  }, [visible])

  if (!visible) return null

  // If we already have a valid saved location, don't nag the user with a full banner unless requested
  const stored = readAppUserLocation()
  if (stored?.lat && stored?.lng && locStatus.status !== 'permission_denied' && locStatus.status !== 'location_off') {
    return null
  }

  const isPermission = locStatus.status === 'permission_denied'

  const handleAction = async () => {
    setBusy(true)
    try {
      await requestDeviceLocation(user?.role)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={boxRef}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        // Floats above the bottom bar instead of sitting in the page flow, so it never pushes headers down.
        className={`keyboard-hide fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-md overflow-hidden rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-500/15 via-amber-50/90 to-amber-100/60 p-3 sm:p-3.5 shadow-md shadow-amber-500/5 backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/30">
            <MapPinOff className="h-5 w-5" aria-hidden />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-extrabold tracking-tight text-amber-950 sm:text-sm">
              {isPermission ? 'Location permission needed' : 'Device location is turned off'}
            </h2>
            <p className="mt-0.5 text-[11px] leading-tight text-amber-900/80 sm:text-xs">
              {isPermission
                ? 'Allow location access so we can automatically fetch your current area.'
                : 'Turn on GPS on your mobile to auto-detect your location.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={handleAction}
              className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-brand/20 transition-all hover:bg-brand-active active:scale-95 disabled:opacity-60"
            >
              <Navigation className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} aria-hidden />
              <span>{busy ? 'Detecting…' : isPermission ? 'Allow' : 'Turn On'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-900/60 hover:bg-amber-200/50 hover:text-amber-950"
              aria-label="Dismiss location banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

