import { apiRequest } from './http.js'

export function updateMyLabourCategories(services) {
  return apiRequest('/users/me/labour-categories', { method: 'PATCH', body: { services } })
}
