import { apiRequest } from './http.js'

export const adminSettingsApi = {
  getSettings: () => {
    return apiRequest('/admin/settings', { method: 'GET' })
  },

  updatePlatformFees: (payload) => {
    return apiRequest('/admin/settings/platform-fees', {
      method: 'PATCH',
      body: payload,
    })
  },

  updateCommission: (payload) => {
    return apiRequest('/admin/settings/commission', {
      method: 'PATCH',
      body: payload,
    })
  },

  updateWalletLimit: (payload) => {
    return apiRequest('/admin/settings/wallet-limit', {
      method: 'PATCH',
      body: payload,
    })
  },

  updateGstPercentage: (payload) => {
    return apiRequest('/admin/settings/gst', {
      method: 'PATCH',
      body: payload,
    })
  },

  updateCancellationPenalty: (payload) => {
    return apiRequest('/admin/settings/penalty', {
      method: 'PATCH',
      body: payload,
    })
  }
}
