const KEY = 'lc-app-address-book'

/** @typedef {{ id: string, label: string, address: string, lat: number | null, lng: number | null, createdAt: number }} SavedAddress */

/** @returns {SavedAddress[]} */
export function readSavedAddresses() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeSavedAddresses(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent('lc-app-address-book-changed'))
}

function toCoord(v) {
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null
}

/** @param {{ label: string, address: string, lat?: number | null, lng?: number | null }} entry @returns {SavedAddress} */
export function addSavedAddress(entry) {
  const saved = {
    id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: entry.label?.trim() || 'Address',
    address: entry.address?.trim() || '',
    lat: toCoord(entry.lat),
    lng: toCoord(entry.lng),
    createdAt: Date.now(),
  }
  writeSavedAddresses([saved, ...readSavedAddresses()])
  return saved
}

export function removeSavedAddress(id) {
  writeSavedAddresses(readSavedAddresses().filter((a) => a.id !== id))
}

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || !Number.isFinite(v))) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
