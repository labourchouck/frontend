import { apiRequest } from './http.js'

export const adminWorkforceApi = {
  getAllRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const url = query ? `/admin/workforce/requests?${query}` : '/admin/workforce/requests'
    return apiRequest(url, { method: 'GET' })
  }
}
