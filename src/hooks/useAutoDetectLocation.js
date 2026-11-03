import { useEffect, useRef } from 'react'
import { readAppUserLocation, writeAppUserLocation } from '../lib/appUserLocationStorage.js'
import { getBrowserLocation, reverseGeocode } from '../lib/locationService.js'
import { USER_ROLES } from '../constants/userRoles.js'

let isFetchingLocation = false

/**
 * Should the automatic GPS refresh replace the saved location?
 * A location the user chose themselves (work area / address) is never replaced behind their back — that would also
 * move a labour on the server, so broadcasts would be matched against where the device is, not where they set
 * themselves. Only a missing or previously auto-detected location is refreshed. `force` is for explicit taps
 * ("Turn on", "Allow", "Current location").
 */
export function shouldAutoRefreshLocation(stored, { force = false } = {}) {
  if (force) return true
  const hasLocation = Boolean(stored) && stored.lat != null && stored.lng != null
  return !hasLocation || stored.auto === true
}
let lastLocationStatus = null

if (typeof window !== 'undefined') {
  window.addEventListener('lc-location-status-changed', (e) => {
    if (e.detail?.status && e.detail.status !== 'fetching') lastLocationStatus = e.detail.status
  })
}

/**
 * Actively requests current live device coordinates and reverse-geocodes them.
 * Updates local storage, syncs with backend for labour, and notifies UI listeners.
 */
export async function requestDeviceLocation(role, { force = false } = {}) {
  if (isFetchingLocation) return
  if (!shouldAutoRefreshLocation(readAppUserLocation(), { force })) {
    console.log('[location] keeping the location the user set manually (not replaced by GPS)')
    return { skipped: true }
  }
  isFetchingLocation = true

  window.dispatchEvent(
    new CustomEvent('lc-location-status-changed', {
      detail: { status: 'fetching' },
    }),
  )

  try {
    const { lat, lng, accuracy } = await getBrowserLocation({ timeout: 12000, maximumAge: 0 })
    const address = (await reverseGeocode(lat, lng)) || ''

    const formattedAddress = address || (lat && lng ? `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}` : '')
    if (formattedAddress) {
      writeAppUserLocation({ address: formattedAddress, lat, lng, auto: true })
      window.dispatchEvent(new CustomEvent('lc-app-user-location-changed'))
    }

    if (role === USER_ROLES.LABOUR && lat && lng) {
      const { updateLabourLocation } = await import('../api/locationApi.js')
      updateLabourLocation(lat, lng).catch(() => {})
    }

    window.dispatchEvent(
      new CustomEvent('lc-location-status-changed', {
        detail: { status: 'success', lat, lng, address: formattedAddress, accuracy },
      }),
    )
    return { success: true, lat, lng, address: formattedAddress }
  } catch (err) {
    const isPermission = err?.code === 1
    window.dispatchEvent(
      new CustomEvent('lc-location-status-changed', {
        detail: {
          status: isPermission ? 'permission_denied' : 'location_off',
          code: err?.code ?? 2,
          message: isPermission
            ? 'Location permission denied. Please allow location access to auto-detect your area.'
            : 'Device location (GPS) is turned off. Please turn on location in your mobile settings.',
        },
      }),
    )
    return { success: false, error: err }
  } finally {
    isFetchingLocation = false
  }
}

/**
 * Automatically fetches the device's live current location on opening the app.
 * Works across all 4 apps: Individual, Vendor, Labour, and Corporate.
 * Also monitors device location toggle and permissions so it refreshes seamlessly.
 */
export function useAutoDetectLocation(user) {
  const role = user?.role
  const lastFetchRef = useRef(0)

  useEffect(() => {
    if (!role) return

    // Auto-fetch current location on opening the app
    const now = Date.now()
    if (now - lastFetchRef.current > 8000) {
      lastFetchRef.current = now
      requestDeviceLocation(role)
    }

    // When the user turns on GPS in phone quick settings and returns to the app
    const handleResume = () => {
      const stored = readAppUserLocation()
      const blocked = lastLocationStatus === 'location_off' || lastLocationStatus === 'permission_denied'
      // Retry at once if GPS/permission was off (the user may have just turned it on), or if the saved
      // location is missing or older than 2 minutes.
      if (blocked || !stored?.lat || !stored?.lng || Date.now() - (stored?.updatedAt || 0) > 120000) {
        requestDeviceLocation(role)
      }
    }

    // Broadcasts are matched on the worker's saved position, so a labour keeps it current while the app is open
    // (not just when it was opened). A location they set themselves is still left alone.
    const refreshId =
      role === USER_ROLES.LABOUR
        ? setInterval(() => {
            if (document.visibilityState === 'visible') requestDeviceLocation(role)
          }, 60000)
        : null

    window.addEventListener('focus', handleResume)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleResume()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Listen to permission status change if supported by the browser
    let permStatus = null
    if (navigator?.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          permStatus = status
          permStatus.onchange = () => {
            if (permStatus.state === 'granted') {
              requestDeviceLocation(role)
            }
          }
        })
        .catch(() => {})
    }

    return () => {
      if (refreshId) clearInterval(refreshId)
      window.removeEventListener('focus', handleResume)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (permStatus) {
        permStatus.onchange = null
      }
    }
  }, [role])
}
