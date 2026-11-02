import { apiRequest } from './http.js'

export const broadcastsApi = {
  getPending: () => apiRequest('/broadcasts/pending'),

  acceptBroadcast: (logId) => {
    return apiRequest(`/broadcasts/${logId}/accept`, { method: 'POST' })
  },

  rejectBroadcast: (logId) => {
    return apiRequest(`/broadcasts/${logId}/reject`, { method: 'POST' })
  },
}
