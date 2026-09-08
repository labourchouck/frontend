import { apiRequest } from './http.js'

/** Public, token-free reads used by the marketing landing page. */

export function fetchLandingLabourCatalogue() {
  return apiRequest('/labour-categories/grouped', { skipAuth: true })
}

export function fetchLandingMartCategories() {
  return apiRequest('/buildmart/app/categories', { skipAuth: true })
}

export function fetchLandingMartProducts() {
  return apiRequest('/buildmart/app/products', { skipAuth: true })
}

export function fetchLandingBanners() {
  return apiRequest(`/banners?_t=${Date.now()}`, { skipAuth: true })
}
