import { apiRequest } from './http.js'

export const bookingsApi = {
  calculateBill: (payload) => {
    return apiRequest('/bookings/calculate', {
      method: 'POST',
      body: payload,
    })
  },

  createBooking: (payload) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: payload,
    })
  },

  getBookingStatus: (id) => {
    return apiRequest(`/bookings/${id}`, { method: 'GET' })
  },
  
  getMyBookings: () => {
    return apiRequest('/bookings/me', { method: 'GET' })
  },

  updateBookingStatus: (id, status) => {
    return apiRequest(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },
}
