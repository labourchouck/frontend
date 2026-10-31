/**
 * Location and Reverse-Geocoding Service
 *
 * Provides resilient client-side geolocation and multi-provider reverse-geocoding
 * without CORS issues or single-point-of-failure restrictions.
 */

let googleMapsPromise = null

/**
 * Ensures the Google Maps JavaScript SDK (with places library) is loaded in the DOM.
 * @returns {Promise<any | null>} Google Maps namespace or null
 */
export function loadGoogleMapsSDK() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.google?.maps?.Geocoder) return Promise.resolve(window.google.maps)

  if (googleMapsPromise) return googleMapsPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) return Promise.resolve(null)

  googleMapsPromise = new Promise((resolve) => {
    const existing = document.querySelector('#google-maps-script')
    if (existing) {
      if (window.google?.maps?.Geocoder) return resolve(window.google.maps)
      const onExisting = () => resolve(window.google?.maps || null)
      existing.addEventListener('load', onExisting, { once: true })
      existing.addEventListener('error', () => resolve(null), { once: true })
      setTimeout(() => resolve(window.google?.maps || null), 4000)
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => resolve(window.google?.maps || null)
    script.onerror = (e) => {
      console.warn('Google Maps script failed to load:', e)
      resolve(null)
    }
    document.head.appendChild(script)
    setTimeout(() => resolve(window.google?.maps || null), 5000)
  })

  return googleMapsPromise
}

/**
 * Promisified browser geolocation using progressive accuracy listening.
 *
 * Uses watchPosition so mobile devices (Android/iOS fused location providers)
 * can stream increasingly accurate GPS/Wi-Fi fixes instead of timing out
 * on a single cold satellite acquisition and falling back to cell towers.
 *
 * @param {object} [options]
 * @param {number} [options.timeout=15000] Maximum milliseconds to wait
 * @param {number} [options.targetAccuracy=80] Target accuracy threshold in meters
 * @param {number} [options.maximumAge=120000] Acceptable cached fix age in ms (2 min)
 * @returns {Promise<{ lat: number, lng: number, accuracy: number }>}
 */
export async function getBrowserLocation(options = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    const err = new Error('Location is not supported on this device or browser.')
    err.code = 0
    throw err
  }

  const timeoutMs = options.timeout ?? 15000
  const targetAccuracy = options.targetAccuracy ?? 80
  const maxAge = options.maximumAge ?? 120000

  return new Promise((resolve, reject) => {
    let watchId = null
    let timer = null
    let bestPosition = null
    let resolved = false

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (watchId != null && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
      }
    }

    const finish = (pos) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? 10000,
      })
    }

    const onPosition = (pos) => {
      if (!pos?.coords || resolved) return
      const acc = pos.coords.accuracy ?? 10000

      // High accuracy fix acquired (GPS / Wi-Fi <= 80m): resolve immediately
      if (acc <= targetAccuracy) {
        finish(pos)
        return
      }

      // Track the best fix as GPS satellites lock
      if (!bestPosition || acc < (bestPosition.coords.accuracy ?? 10000)) {
        bestPosition = pos
      }
    }

    const onError = (err) => {
      if (resolved) return
      // User explicitly denied permission
      if (err?.code === 1 /* PERMISSION_DENIED */) {
        resolved = true
        cleanup()
        const error = new Error('Location permission denied. Please allow location access in your device settings.')
        error.code = 1
        reject(error)
      }
    }

    // Set overall timeout
    timer = setTimeout(() => {
      if (resolved) return

      // If we acquired any reading within 600m accuracy during the watch, accept it
      if (bestPosition && (bestPosition.coords.accuracy ?? 10000) <= 600) {
        finish(bestPosition)
        return
      }

      // Fallback: one final attempt
      cleanup()
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(pos),
        (err) => {
          if (bestPosition) {
            finish(bestPosition)
          } else {
            let msg = 'Could not determine GPS location. Please search or select your area below.'
            if (err?.code === 1) msg = 'Location permission denied. Please allow location access in your device settings.'
            const error = new Error(msg)
            error.code = err?.code ?? 3
            reject(error)
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 },
      )
    }, timeoutMs)

    try {
      watchId = navigator.geolocation.watchPosition(onPosition, onError, {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: maxAge,
      })
    } catch (e) {
      cleanup()
      reject(e)
    }
  })
}

/**
 * Reverse geocodes coordinates (lat, lng) to a detailed human-readable address.
 *
 * Attempts:
 * 1. Google Maps JS SDK Geocoder (most detailed street/colony/area results in India)
 * 2. OpenStreetMap Nominatim API (CORS-enabled simple fetch)
 * 3. BigDataCloud Reverse Geocoding Client API (CORS-enabled, free client endpoint)
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} Detailed formatted address string or empty string on failure
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return ''
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''

  // 1. Google Maps JS Geocoder (ensures SDK is loaded and geocodes accurately)
  try {
    const maps = await loadGoogleMapsSDK()
    if (maps && maps.Geocoder) {
      const googleAddress = await new Promise((resolve) => {
        const geocoder = new maps.Geocoder()
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            // Find the most detailed address result (street_address, premise, route, sublocality, etc.)
            const detailed = results.find(
              (r) =>
                r.types.includes('street_address') ||
                r.types.includes('premise') ||
                r.types.includes('subpremise') ||
                r.types.includes('route') ||
                r.types.includes('sublocality_level_1') ||
                r.types.includes('sublocality_level_2') ||
                r.types.includes('sublocality') ||
                r.types.includes('neighborhood'),
            ) || results[0]

            resolve(detailed.formatted_address)
          } else {
            resolve(null)
          }
        })
      })
      if (googleAddress) return cleanAddressString(googleAddress)
    }
  } catch (e) {
    console.warn('Google JS Geocoder lookup skipped:', e)
  }

  // 2. OpenStreetMap Nominatim API (without custom headers to prevent CORS preflight rejection)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5500)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      if (data) {
        const formatted = formatNominatimAddress(data)
        if (formatted) return formatted
      }
    }
  } catch (e) {
    console.warn('Nominatim reverse geocode skipped:', e)
  }

  // 3. BigDataCloud Client Reverse Geocode API
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5500)
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      if (data) {
        const formatted = formatBigDataCloudAddress(data)
        if (formatted) return formatted
      }
    }
  } catch (e) {
    console.warn('BigDataCloud reverse geocode skipped:', e)
  }

  return ''
}

function cleanAddressString(str) {
  if (!str) return ''
  return str.replace(/\s+/g, ' ').trim()
}

function formatNominatimAddress(data) {
  if (!data) return ''
  const addr = data.address || {}

  const premise = addr.road || addr.pedestrian || addr.building || addr.amenity || addr.house_name || ''
  const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || ''
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
  const state = addr.state || ''
  const postcode = addr.postcode || ''

  // Only use custom short parts if we actually have a specific road, premise, or locality
  if (premise || locality) {
    const parts = [premise, locality, city, state, postcode].filter(Boolean)
    const uniqueParts = parts.filter(
      (item, index) => parts.findIndex((p) => p.toLowerCase() === item.toLowerCase()) === index,
    )
    if (uniqueParts.length >= 2) {
      return uniqueParts.join(', ')
    }
  }

  // Otherwise, display_name has the fullest descriptive string
  if (data.display_name) {
    return cleanAddressString(data.display_name)
  }

  return ''
}

function formatBigDataCloudAddress(data) {
  if (!data) return ''
  const locality = data.locality || ''
  const city = data.city || ''
  const state = data.principalSubdivision || ''
  const postcode = data.postcode || ''

  // Extract landmarks and neighbourhood names from informative & administrative arrays
  const localNames = []
  if (Array.isArray(data.localityInfo?.informative)) {
    for (const item of data.localityInfo.informative) {
      if (
        item.name &&
        !item.name.toLowerCase().includes(city.toLowerCase()) &&
        !item.name.toLowerCase().includes(state.toLowerCase()) &&
        !localNames.includes(item.name)
      ) {
        localNames.push(item.name)
      }
    }
  }
  if (Array.isArray(data.localityInfo?.administrative)) {
    for (const item of data.localityInfo.administrative) {
      if (
        item.name &&
        item.order >= 5 &&
        !item.name.toLowerCase().includes(city.toLowerCase()) &&
        !item.name.toLowerCase().includes(state.toLowerCase()) &&
        !localNames.includes(item.name)
      ) {
        localNames.push(item.name)
      }
    }
  }

  const localArea = locality || localNames.slice(0, 2).join(', ')
  const parts = [localArea, city, state, postcode].filter(Boolean)
  const uniqueParts = parts.filter(
    (item, index) => parts.findIndex((p) => p.toLowerCase() === item.toLowerCase()) === index,
  )

  return uniqueParts.join(', ')
}
