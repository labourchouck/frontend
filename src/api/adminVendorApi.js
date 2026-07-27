import { apiRequest } from './http.js'

export function fetchAdminVendorsAndCrew() {
  return apiRequest('/admin/vendors/crew')
}
