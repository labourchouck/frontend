import { baseApi } from './baseApi.js'

function unwrap(response) {
  return response?.data ?? response
}

export const adminBookingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminBookings: build.query({
      query: (params) => ({ url: '/admin/bookings', params }),
      transformResponse: unwrap,
      providesTags: ['AdminBookings'],
    }),
    getAdminBookingById: build.query({
      query: (id) => `/admin/bookings/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'AdminBookings', id }],
    }),
    createAdminBooking: build.mutation({
      query: (body) => ({ url: '/admin/bookings', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminBookings'],
    }),
    updateAdminBooking: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/bookings/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminBookings', (_r, _e, { id }) => ({ type: 'AdminBookings', id })],
    }),
    patchAdminBookingStatus: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/bookings/${id}/status`,
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminBookings', (_r, _e, { id }) => ({ type: 'AdminBookings', id })],
    }),
    assignAdminBooking: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/bookings/${id}/assign`,
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminBookings', (_r, _e, { id }) => ({ type: 'AdminBookings', id })],
    }),
    deleteAdminBooking: build.mutation({
      query: (id) => ({
        url: `/admin/bookings/${id}`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminBookings'],
    }),
  }),
})

export const {
  useGetAdminBookingsQuery,
  useGetAdminBookingByIdQuery,
  useCreateAdminBookingMutation,
  useUpdateAdminBookingMutation,
  usePatchAdminBookingStatusMutation,
  useAssignAdminBookingMutation,
  useDeleteAdminBookingMutation,
} = adminBookingApi
