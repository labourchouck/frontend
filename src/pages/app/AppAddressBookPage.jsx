import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Briefcase, Home as HomeIcon, Loader2, MapPin, Navigation, Plus, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  addSavedAddress,
  distanceKm,
  readSavedAddresses,
  removeSavedAddress,
} from '../../lib/appAddressBookStorage.js'
import { AppModal } from '../../components/app-ui/feedback/AppModal.jsx'
import { AppTextInput } from '../../components/app-ui/inputs/AppTextInput.jsx'
import { AppButton } from '../../components/app-ui/buttons/AppButton.jsx'

const LABEL_ICONS = {
  home: HomeIcon,
  office: Briefcase,
}

function labelIconFor(label) {
  const key = label?.trim().toLowerCase()
  return LABEL_ICONS[key] || MapPin
}

export function AppAddressBookPage() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const inputRef = useRef(null)

  const [addresses, setAddresses] = useState(() => readSavedAddresses())
  const [here, setHere] = useState({ lat: null, lng: null })
  const [locating, setLocating] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('Home')
  const [newAddress, setNewAddress] = useState('')
  const [newLat, setNewLat] = useState(null)
  const [newLng, setNewLng] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const refresh = () => setAddresses(readSavedAddresses())
    window.addEventListener('lc-app-address-book-changed', refresh)
    return () => window.removeEventListener('lc-app-address-book-changed', refresh)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 },
    )
  }, [])

  // Google Places Autocomplete on the search box, same pattern used at checkout.
  useEffect(() => {
    if (!addOpen) return
    function initAutocomplete() {
      if (!inputRef.current || !window.google?.maps?.places) return
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['geocode', 'establishment'],
      })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry?.location) {
          setNewLat(place.geometry.location.lat())
          setNewLng(place.geometry.location.lng())
          setNewAddress(place.formatted_address || place.name || '')
        }
      })
    }

    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    if (!document.querySelector('#google-maps-script')) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.head.appendChild(script)
    } else {
      document.querySelector('#google-maps-script').addEventListener('load', initAutocomplete)
    }
  }, [addOpen])

  const openAdd = useCallback(() => {
    setNewLabel('Home')
    setNewAddress('')
    setNewLat(null)
    setNewLng(null)
    setAddOpen(true)
  }, [])

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude
        const ln = pos.coords.longitude
        setHere({ lat: la, lng: ln })
        let addr = ''
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${la},${ln}&key=${apiKey}`,
            )
            const data = await res.json()
            if (data.status === 'OK' && data.results?.[0]) addr = data.results[0].formatted_address
          }
        } catch {
          /* reverse geocode is best-effort */
        }
        setLocating(false)
        setNewLabel('Home')
        setNewAddress(addr)
        setNewLat(la)
        setNewLng(ln)
        setAddOpen(true)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 14_000, maximumAge: 60_000 },
    )
  }, [])

  const saveNewAddress = useCallback(
    (e) => {
      e.preventDefault()
      if (!newAddress.trim()) return
      setSaving(true)
      addSavedAddress({ label: newLabel, address: newAddress, lat: newLat, lng: newLng })
      setAddresses(readSavedAddresses())
      setSaving(false)
      setAddOpen(false)
    },
    [newLabel, newAddress, newLat, newLng],
  )

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-slate-50 pb-10"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Search your location</h1>
      </header>

      <div className="space-y-5 px-4 pt-4">
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-left text-sm font-medium text-slate-400 shadow-sm transition hover:border-brand/30"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          Search locality, sector, area
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <button
            type="button"
            onClick={openAdd}
            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <Plus className="h-4 w-4 text-brand" aria-hidden />
              <span className="text-sm font-bold text-brand">Add address</span>
            </span>
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
              ) : (
                <Navigation className="h-4 w-4 text-brand" aria-hidden />
              )}
              <span className="text-sm font-bold text-brand">Use current location</span>
            </span>
          </button>
        </div>

        <section>
          <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Saved addresses
          </p>
          {addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white/60 p-6 text-center">
              <MapPin className="mx-auto h-6 w-6 text-slate-300" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-slate-700">No saved addresses yet</p>
              <p className="mt-1 text-xs text-slate-500">Add your home or office so booking is faster next time.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {addresses.map((a) => {
                const Icon = labelIconFor(a.label)
                const km = distanceKm(here.lat, here.lng, a.lat, a.lng)
                return (
                  <li
                    key={a.id}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition hover:border-brand/25"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{a.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-500">
                        {a.address}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {km != null ? <span className="text-[11px] font-bold text-slate-400">{km.toFixed(1)} km</span> : null}
                      <button
                        type="button"
                        onClick={() => {
                          removeSavedAddress(a.id)
                          setAddresses(readSavedAddresses())
                        }}
                        className="rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        aria-label={`Remove ${a.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <AppModal open={addOpen} onClose={() => !saving && setAddOpen(false)} title="Add address">
        <form onSubmit={saveNewAddress} className="space-y-4">
          <div>
            <label htmlFor="addr-label" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Label
            </label>
            <div className="flex gap-2">
              {['Home', 'Office', 'Other'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setNewLabel(opt)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    newLabel === opt
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand/30'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="addr-text" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Address
            </label>
            <AppTextInput
              id="addr-text"
              ref={inputRef}
              placeholder="Search locality, sector, area"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <AppButton type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </AppButton>
            <AppButton type="submit" loading={saving} disabled={!newAddress.trim()}>
              Save address
            </AppButton>
          </div>
        </form>
      </AppModal>
    </motion.div>
  )
}
