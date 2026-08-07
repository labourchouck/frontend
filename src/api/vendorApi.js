import { apiRequest } from './http.js'

export const vendorApi = {
  // 1. Auth, Profile & KYC
  getMe: () => apiRequest('/vendor/me', { method: 'GET' }),
  
  updateProfile: (data) => apiRequest('/vendor/me', { 
    method: 'PATCH', 
    body: data 
  }),

  deleteAccount: () => apiRequest('/users/me', {
    method: 'DELETE'
  }),
  
  uploadDocument: (data) => apiRequest('/vendor/documents', { 
    method: 'POST', 
    body: data 
  }),
  
  deleteDocument: (docId) => apiRequest(`/vendor/documents/${docId}`, { 
    method: 'DELETE' 
  }),
  
  submitVerification: () => apiRequest('/vendor/verification/submit', { 
    method: 'POST' 
  }),

  // 2. Dashboard
  getDashboardStats: () => apiRequest('/vendor/dashboard', { method: 'GET' }),

  // 3. Crew Management (Workforce)
  getCrew: () => apiRequest('/vendor/crew', { method: 'GET' }),
  
  requestWorkerLink: (phone) => apiRequest('/vendor/crew/link', { 
    method: 'POST', 
    body: { phone } 
  }),
  
  verifyWorkerLink: (data) => apiRequest('/vendor/crew/link/verify', { 
    method: 'POST', 
    body: data 
  }),
  
  removeWorker: (workerId) => apiRequest(`/vendor/crew/${workerId}`, { 
    method: 'DELETE' 
  }),

  // 4. Job Allocations (Supply)
  getJobs: () => apiRequest('/vendor/jobs', { method: 'GET' }),
  
  getJobById: (id) => apiRequest(`/vendor/jobs/${id}`, { method: 'GET' }),
  
  acceptJob: (id) => apiRequest(`/vendor/jobs/${id}/accept`, { method: 'POST' }),
  
  rejectJob: (id) => apiRequest(`/vendor/jobs/${id}/reject`, { method: 'POST' }),
  collectCashPayment: (id) => apiRequest(`/vendor/jobs/${id}/collect-cash`, { method: 'POST' }),

  // 5. Analytics & Insights
  getAnalytics: (days = 30) => apiRequest(`/vendor/analytics?days=${days}`, { method: 'GET' }),

  // 6. Earnings & Settlements
  getSettlements: () => apiRequest('/vendor/settlements', { method: 'GET' }),

  // 7. Withdrawals (Payout)
  getWithdrawals: () => apiRequest('/vendor/withdrawals', { method: 'GET' }),
  
  requestWithdrawal: (data) => apiRequest('/vendor/withdrawals/request', { 
    method: 'POST', 
    body: data 
  }),

  // 8. Banners
  getBanners: () => apiRequest('/vendor/banners', { method: 'GET' }),
  
  // Crew Labour Endpoints
  requestCrewOtp: (phone) => apiRequest('/vendor/crew-labour/request-otp', { method: 'POST', body: { phone } }),
  verifyCrewOtp: (data) => apiRequest('/vendor/crew-labour/verify-otp', { method: 'POST', body: data }),
  createCrewLabour: (data) => apiRequest('/vendor/crew-labour', { method: 'POST', body: data }),
  getCrewLabour: () => apiRequest('/vendor/crew-labour', { method: 'GET' }),
  getCrewLabourById: (id) => apiRequest(`/vendor/crew-labour/${id}`, { method: 'GET' }),
  updateCrewLabour: (id, data) => apiRequest(`/vendor/crew-labour/${id}`, { method: 'PUT', body: data }),
  patchCrewLabour: (id, data) => apiRequest(`/vendor/crew-labour/${id}`, { method: 'PATCH', body: data }),
  deleteCrewLabour: (id) => apiRequest(`/vendor/crew-labour/${id}`, { method: 'DELETE' }),

  // 9. Subscriptions
  getSubscriptionPlans: () => apiRequest('/vendor/subscriptions/plans', { method: 'GET' }),
  
  subscribeToPlan: (planId) => apiRequest('/vendor/subscriptions/subscribe', {
    method: 'POST',
    body: { planId }
  })
}
