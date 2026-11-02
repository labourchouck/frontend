import { useEffect, useRef } from 'react'
import { readAppUserLocation, writeAppUserLocation } from '../lib/appUserLocationStorage.js'
import { getBrowserLocation, reverseGeocode } from '../lib/locationService.js'
import { USER_ROLES } from '../constants/userRoles.js'

let isFetchingLocation = false

/**
 * Actively requests current live device coordinates and reverse-geocodes them.
 * Updates local storage, syncs with backend for labour, and notifies UI listeners.
 */
export async function requestDeviceLocation(role) {
  if (isFetchingLocation) return
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
      // If location is missing or older than 2 minutes, refresh immediately
      if (!stored?.lat || !stored?.lng || Date.now() - (stored?.updatedAt || 0) > 120000) {
        requestDeviceLocation(role)
      }
    }

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
      window.removeEventListener('focus', handleResume)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (permStatus) {
        permStatus.onchange = null
      }
    }
  }, [role])
}
