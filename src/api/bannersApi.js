import { apiRequest } from './http.js'

export function fetchActiveBanners() {
  return apiRequest('/banners', { skipAuth: true })
}
