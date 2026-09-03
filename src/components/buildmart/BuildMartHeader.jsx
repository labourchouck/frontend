import { Menu, ChevronDown, User, ShoppingBag, MapPin } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { readAppUserLocation } from '../../lib/appUserLocationStorage.js'
import { AppUserLocationModal } from '../app/AppUserLocationModal.jsx'

export function BuildMartHeader({ onOpenDrawer }) {
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [appLocation, setAppLocation] = useState(() => readAppUserLocation())

  useEffect(() => {
    const onLoc = () => {
      setAppLocation(readAppUserLocation())
    }
    window.addEventListener('lc-app-user-location-changed', onLoc)
    return () => window.removeEventListener('lc-app-user-location-changed', onLoc)
  }, [])

  const { individualLocationTitle } = useMemo(() => {
    const addr = appLocation?.address?.trim()
    const la = appLocation?.lat
    const ln = appLocation?.lng
    
    // For a short display, just take the first part of the address or "Set Location"
    if (addr) {
      const parts = addr.split(',')
      return parts[0].trim() || 'Location'
    }
    if (la != null && ln != null) {
      return `${la.toFixed(2)}, ${ln.toFixed(2)}`
    }
    return 'Set Location'
  }, [appLocation])

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-3 py-3 shadow-sm">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            className="flex h-10 w-10 items-center justify-center text-slate-800"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="flex h-[34px] items-center rounded-lg bg-[#00A64C] px-2.5 text-xs font-bold text-white tracking-wide">
              60 Mins
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Deliver To</span>
              <button 
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-0.5 text-sm font-bold text-slate-800 truncate max-w-[120px] -mt-0.5"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{individualLocationTitle}</span>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Right section (Logo) */}
        <div className="flex items-center">
          <img src="/logo-transparent.svg" alt="LabourChowk" className="h-6 w-auto" />
        </div>
      </header>
      
      <AppUserLocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSaved={() => setAppLocation(readAppUserLocation())}
      />
    </>
  )
}
