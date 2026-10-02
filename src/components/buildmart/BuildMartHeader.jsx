import { Menu, ChevronDown, MapPin, Mic, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { readAppUserLocation } from '../../lib/appUserLocationStorage.js'
import { AppUserLocationModal } from '../app/AppUserLocationModal.jsx'
import { useVoiceSearch } from '../app/individual/home/useVoiceSearch.js'

const SEARCH_HINTS = ['Cement', 'TMT Bars', 'Tiles', 'PVC Pipes', 'Paint', 'Bricks', 'Plywood', 'Wires']

/** Rotating placeholder word inside the search pill. */
function RotatingHint() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % SEARCH_HINTS.length), 2400)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          className="font-semibold text-slate-700"
          initial={reduce ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: -12, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          ‘{SEARCH_HINTS[i]}’
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function BuildMartHeader({ onOpenDrawer }) {
  const navigate = useNavigate()
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [appLocation, setAppLocation] = useState(() => readAppUserLocation())
  const voice = useVoiceSearch((text) => navigate(`/app/buildmart/category/all?q=${encodeURIComponent(text)}`))

  useEffect(() => {
    const onLoc = () => {
      setAppLocation(readAppUserLocation())
    }
    window.addEventListener('lc-app-user-location-changed', onLoc)
    return () => window.removeEventListener('lc-app-user-location-changed', onLoc)
  }, [])

  const individualLocationTitle = useMemo(() => {
    const addr = appLocation?.address?.trim()
    const la = appLocation?.lat
    const ln = appLocation?.lng

    if (addr) {
      return addr
    }
    if (la != null && ln != null) {
      return 'Current location'
    }
    return 'Set your location'
  }, [appLocation])

  return (
    <>
      <header className="sticky top-0 z-30 bg-brand px-3 pb-3 pt-3 shadow-[0_8px_20px_-14px_rgba(15,23,42,0.6)]">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              onClick={onOpenDrawer}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex min-w-0 flex-col">
              <span className="text-[11px] font-semibold text-white/75">Deliver to site</span>
              <button
                onClick={() => setLocationModalOpen(true)}
                className="-mt-0.5 flex min-w-0 max-w-[190px] items-center gap-0.5 text-sm font-extrabold text-white"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-white/80" aria-hidden />
                <span className="truncate">{individualLocationTitle}</span>
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </div>

          <img
            src="/assets/images/mappto_logo_tile_white.png"
            alt="Mappto"
            className="h-10 w-10 shrink-0 rounded-xl object-contain shadow-[0_4px_12px_-4px_rgba(15,23,42,0.45)]"
          />
        </div>

        <div
          className={`mt-3 flex h-11 w-full items-center rounded-xl bg-white text-sm shadow-sm ring-2 transition ${
            voice.listening ? 'ring-red-300' : 'ring-transparent'
          }`}
        >
          <button
            type="button"
            onClick={() => navigate('/app/buildmart/category/all?focus=1')}
            className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-3.5 text-left text-slate-400 transition active:scale-[0.99]"
            aria-label="Search building materials"
          >
            <Search className="h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden />
            {voice.listening ? (
              <span className="font-semibold text-red-500">Listening… speak now</span>
            ) : (
              <span className="truncate">
                Search for <RotatingHint />
              </span>
            )}
          </button>
          {voice.supported ? (
            <button
              type="button"
              onClick={voice.start}
              className={`mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                voice.listening ? 'animate-pulse bg-red-500 text-white' : 'text-brand hover:bg-emerald-50'
              }`}
              aria-label={voice.listening ? 'Stop voice search' : 'Search materials by voice'}
              aria-pressed={voice.listening}
            >
              <Mic className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : null}
        </div>
        {voice.error ? <p className="mt-1 px-1 text-[11px] font-semibold text-white">{voice.error}</p> : null}
      </header>

      <AppUserLocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSaved={() => setAppLocation(readAppUserLocation())}
      />
    </>
  )
}
