import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Loader2, MapPin, Navigation, Search, X } from 'lucide-react'
import { readAppUserLocation, writeAppUserLocation } from '../../lib/appUserLocationStorage.js'
import { getBrowserLocation, loadGoogleMapsSDK, reverseGeocode } from '../../lib/locationService.js'

function formatCoords(lat, lng) {
  if (lat == null || lng == null) return ''
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

const QUICK_AREAS = ['Vijay Nagar', 'Old Palasia', 'Bhawarkua', 'Rajwada', 'Sudama Nagar', 'Chhavani']

export function AppUserLocationModal({
  open,
  onClose,
  onSaved,
  title = 'Your location',
  subtitle = 'Shown on Home — used for nearby matches',
  saveLabel = 'Save location',
  requireLocation = false,
}) {
  const reduce = useReducedMotion()
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [hint, setHint] = useState('')

  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const stored = readAppUserLocation()
    queueMicrotask(() => {
      setAddress(stored?.address ?? '')
      setLat(stored?.lat ?? null)
      setLng(stored?.lng ?? null)
      setHint('')
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Pre-load Google Maps SDK and attach Places Autocomplete to the search input
  useEffect(() => {
    if (!open) return
    let active = true

    loadGoogleMapsSDK().then((maps) => {
      if (!active || !maps?.places || !searchInputRef.current) return
      if (autocompleteRef.current) return

      try {
        const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' },
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place.geometry?.location) {
            const placeLat = place.geometry.location.lat()
            const placeLng = place.geometry.location.lng()
            const placeAddr = place.formatted_address || place.name || ''
            setLat(placeLat)
            setLng(placeLng)
            setAddress(placeAddr)
            setHint('Location selected. Tap "Save location" below.')
          }
        })

        autocompleteRef.current = autocomplete
      } catch (err) {
        console.warn('Google Autocomplete initialization error:', err)
      }
    })

    return () => {
      active = false
      autocompleteRef.current = null
    }
  }, [open])

  const fetchCurrent = useCallback(async () => {
    setGeoBusy(true)
    setHint('Getting accurate GPS coordinates…')
    try {
      const pos = await getBrowserLocation({ timeout: 15000, targetAccuracy: 60 })
      const la = pos.lat
      const ln = pos.lng
      setLat(la)
      setLng(ln)

      setHint('Fetching street & area name…')
      const resolvedAddress = await reverseGeocode(la, ln)
      if (resolvedAddress) {
        setAddress(resolvedAddress)
        setHint(
          pos.accuracy > 1000
            ? 'Approximate location detected. Check address or select your area below.'
            : 'Location & address fetched. Tap "Save location" below.',
        )
      } else {
        setAddress((prev) => prev.trim() || `Location (${la.toFixed(5)}, ${ln.toFixed(5)})`)
        setHint('Coordinates updated. You can search or edit your area below.')
      }
    } catch (err) {
      console.warn('Location fetch failed:', err)
      setHint(err.message || 'Could not read GPS. Search or enter your area below.')
    } finally {
      setGeoBusy(false)
    }
  }, [])

  const selectQuickArea = useCallback(async (areaName) => {
    const fullQuery = `${areaName}, Indore, Madhya Pradesh`
    setAddress(fullQuery)
    setHint(`Setting area to ${areaName}…`)
    try {
      const maps = await loadGoogleMapsSDK()
      if (maps?.Geocoder) {
        const geocoder = new maps.Geocoder()
        geocoder.geocode({ address: fullQuery, componentRestrictions: { country: 'in' } }, (results, status) => {
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const loc = results[0].geometry.location
            setLat(loc.lat())
            setLng(loc.lng())
            setAddress(results[0].formatted_address || fullQuery)
            setHint(`Selected ${areaName}. Tap "Save location" below.`)
          }
        })
      }
    } catch {
      // Address text is already updated
    }
  }, [])

  const canSave = requireLocation ? Boolean(address.trim() || (lat != null && lng != null)) : true

  const save = useCallback(() => {
    const trimmed = address.trim()
    if (requireLocation && !trimmed && (lat == null || lng == null)) {
      setHint('Enter your area or fetch current location before continuing.')
      return
    }
    writeAppUserLocation({ address: trimmed, lat, lng })
    window.dispatchEvent(new CustomEvent('lc-app-user-location-changed'))
    onSaved?.()
    onClose()
  }, [address, lat, lng, onClose, onSaved, requireLocation])

  const sheet = (
    <AnimatePresence>
      {open ? (
      <motion.div
        className="fixed inset-0 z-[200] flex h-[100dvh] max-h-[100dvh] flex-col bg-white"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-loc-title"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-brand/10 via-emerald-50/30 to-transparent" aria-hidden />

        <header className="relative flex shrink-0 items-center gap-2 border-b border-slate-100/90 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-brand/30 active:scale-[0.98]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 id="app-loc-title" className="truncate text-lg font-black tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="truncate text-xs font-medium text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <motion.div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 space-y-5">
          <section className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 ring-1 ring-slate-100/80">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand ring-1 ring-brand/15">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Current</p>
                {address ? (
                  <>
                    <p className="text-sm font-semibold leading-snug text-slate-900">{address}</p>
                    {lat != null && lng != null ? (
                      <p className="text-[11px] font-medium text-slate-500">GPS: {formatCoords(lat, lng)}</p>
                    ) : null}
                  </>
                ) : lat != null && lng != null ? (
                  <p className="text-sm font-semibold leading-snug text-slate-900">{formatCoords(lat, lng)}</p>
                ) : (
                  <p className="text-sm font-medium text-slate-500">No location saved yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Update</p>
            <button
              type="button"
              onClick={fetchCurrent}
              disabled={geoBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/35 bg-white py-3.5 text-sm font-bold text-brand shadow-sm transition hover:bg-brand/5 active:scale-[0.99] disabled:opacity-60"
            >
              {geoBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Navigation className="h-4 w-4" aria-hidden />}
              Fetch current location
            </button>
            {hint ? <p className="text-center text-[11px] font-medium text-slate-500">{hint}</p> : null}
          </section>

          <section className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Or search area, colony or landmark
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="h-4 w-4" aria-hidden />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Type colony, landmark, or area (e.g. Vijay Nagar)…"
                  className="w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                />
                {address ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress('')
                      setHint('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear location"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </label>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Popular:</span>
              {QUICK_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => selectQuickArea(area)}
                  className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand active:scale-95"
                >
                  {area}
                </button>
              ))}
            </div>
          </section>
        </motion.div>

        <div className="shrink-0 border-t border-slate-200/90 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_-8px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="w-full rounded-2xl bg-linear-to-r from-brand to-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-brand/25 transition hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveLabel}
          </button>
        </div>
      </motion.div>
      ) : null}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  if (!open) return null
  return createPortal(sheet, document.body)
}
