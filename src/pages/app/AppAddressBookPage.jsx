import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Briefcase, Home as HomeIcon, Loader2, MapPin, Navigation, Plus, Trash2 } from 'lucide-react'
import {
  addSavedAddress,
  distanceKm,
  readSavedAddresses,
  removeSavedAddress,
} from '../../lib/appAddressBookStorage.js'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { AppModal } from '../../components/app-ui/feedback/AppModal.jsx'
import { AppTextInput } from '../../components/app-ui/inputs/AppTextInput.jsx'
import { AppButton } from '../../components/app-ui/buttons/AppButton.jsx'

const LABEL_ICONS = { home: HomeIcon, office: Briefcase }
const LABEL_OPTIONS = ['Home', 'Office', 'Other']

function labelIconFor(label) {
  return LABEL_ICONS[label?.trim().toLowerCase()] || MapPin
}

export function AppAddressBookPage() {
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

  // Google Places Autocomplete on the address field, same loader pattern as checkout.
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
    const existing = document.querySelector('#google-maps-script')
    if (existing) {
      existing.addEventListener('load', initAutocomplete)
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = initAutocomplete
    document.head.appendChild(script)
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
          /* reverse geocode is best-effort; user can still type the address */
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
      addSavedAddress({ label: newLabel, address: newAddress, lat: newLat, lng: newLng })
      setAddOpen(false)
    },
    [newLabel, newAddress, newLat, newLng],
  )

  return (
    <motion.div
      className="space-y-5 pb-6"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AppStackScreenHeader title="Address book" backTo="/app/profile" />

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100"
        >
          <Plus className="h-4 w-4 text-brand" aria-hidden />
          <span className="text-sm font-bold text-brand">Add address</span>
        </button>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
          ) : (
            <Navigation className="h-4 w-4 text-brand" aria-hidden />
          )}
          <span className="text-sm font-bold text-brand">Use current location</span>
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
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{a.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-500">
                      {a.address}
                    </p>
                    {km != null ? (
                      <p className="mt-1 text-[11px] font-bold text-slate-400">{km.toFixed(1)} km away</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSavedAddress(a.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${a.label}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <AppModal open={addOpen} onClose={() => setAddOpen(false)} title="Add address">
        <form onSubmit={saveNewAddress} className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">Label</p>
            <div className="flex gap-2">
              {LABEL_OPTIONS.map((opt) => (
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
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <AppButton type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={!newAddress.trim()}>
              Save address
            </AppButton>
          </div>
        </form>
      </AppModal>
    </motion.div>
  )
}
