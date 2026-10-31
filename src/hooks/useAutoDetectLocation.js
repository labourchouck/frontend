import { useEffect } from 'react'
import { readAppUserLocation, writeAppUserLocation } from '../lib/appUserLocationStorage.js'
import { getBrowserLocation, reverseGeocode } from '../lib/locationService.js'
import { USER_ROLES } from '../constants/userRoles.js'

const SESSION_KEY = 'lc-auto-location-attempted'

/**
 * Fetches the device location once per app session when a shell opens.
 * A location the user chose manually is never overwritten; GPS-detected ones are refreshed.
 */
export function useAutoDetectLocation(user) {
  const role = user?.role
  useEffect(() => {
    if (!role) return
    try {
      if (sessionStorage.getItem(SESSION_KEY) === role) return
      sessionStorage.setItem(SESSION_KEY, role)
    } catch {
      /* ignore */
    }
    const stored = readAppUserLocation()
    if (stored && !stored.auto) return

    let cancelled = false
    ;(async () => {
      try {
        const { lat, lng, accuracy } = await getBrowserLocation()
        // If accuracy is coarse (> 800m, typical of cell tower IP gateways) and an address exists, keep existing
        if (accuracy > 800 && stored?.address) return

        const address = (await reverseGeocode(lat, lng)) || stored?.address || ''
        if (cancelled || !address) return

        writeAppUserLocation({ address, lat, lng, auto: true })
        window.dispatchEvent(new CustomEvent('lc-app-user-location-changed'))
        if (role === USER_ROLES.LABOUR) {
          const { updateLabourLocation } = await import('../api/locationApi.js')
          updateLabourLocation(lat, lng).catch(() => {})
        }
      } catch {
        // Permission denied/unavailable: user can still set it manually.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [role])
}
