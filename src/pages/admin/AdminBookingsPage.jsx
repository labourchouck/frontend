import { useState } from 'react'
import { ClipboardList, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { PipelineTimeline } from '../../components/shared/PipelineTimeline.jsx'
import {
  useGetAdminRequestsQuery,
  usePatchRequestStatusMutation,
} from '../../store/api/workforceApi.js'
import {
  useGetAdminBookingsQuery,
  usePatchAdminBookingStatusMutation,
  useDeleteAdminBookingMutation
} from '../../store/api/adminBookingApi.js'

const REQUEST_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'allocating', label: 'Allocating' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const BOOKING_STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'CREATED', label: 'Created' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'STARTED', label: 'Started' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const QUICK_ACTIONS = [
  { status: 'confirmed', label: 'Confirm' },
  { status: 'allocating', label: 'Allocate' },
  { status: 'cancelled', label: 'Cancel' },
]

function CorporateRequestsTab() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading, isError } = useGetAdminRequestsQuery(
    statusFilter ? { status: statusFilter } : undefined,
  )
  const [patchStatus, { isLoading: patching }] = usePatchRequestStatusMutation()
  const requests = data?.requests ?? []

  const handleStatus = async (id, status) => {
    try {
      await patchStatus({ id, status }).unwrap()
    } catch {
      /* handle later */
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-wrap gap-2">
        {REQUEST_STATUS_FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
              statusFilter === f.value
                ? 'bg-brand text-white ring-brand'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-brand/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <GlassPanel className="p-6">
          <p className="text-sm text-slate-500">Loading requests…</p>
        </GlassPanel>
      ) : null}

      {isError ? (
        <GlassPanel className="border-rose-200 p-6">
          <p className="text-sm font-semibold text-rose-800">Failed to load requests.</p>
        </GlassPanel>
      ) : null}

      {!isLoading && !isError && requests.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-700">No requests in this filter.</p>
        </GlassPanel>
      ) : null}

      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r._id}>
            <GlassPanel className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{r.reference}</p>
                  <p className="text-xs text-slate-500">
                    {r.sourceType} ·{' '}
                    {r.clientId?.corporateProfile?.companyName || r.clientId?.fullName || 'Client'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.locationText || 'No location'} · {(r.lines?.length ?? 0)} line(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      disabled={patching || r.status === a.status}
                      onClick={() => handleStatus(r._id, a.status)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-brand/30 disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <PipelineTimeline status={r.status} title="Request pipeline" />
            </GlassPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">Booking Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 transition">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Service</p>
              <p className="font-semibold">{booking.serviceId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Subcategory</p>
              <p className="font-semibold">{booking.subcategoryId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Status</p>
              <p className="font-bold text-brand">{booking.status}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Payment Method</p>
              <p className="font-semibold">{booking.paymentMethod}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Duration</p>
              <p className="font-semibold">{booking.durationDays} {booking.durationKind}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Scheduled At</p>
              <p className="font-semibold">{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-slate-500 text-xs mb-1">User Information</p>
            <p className="font-semibold">{booking.userId?.fullName}</p>
            <p className="text-slate-600">{booking.userId?.phone}</p>
            <p className="text-slate-600 mt-1 text-xs">{booking.address?.locationText}</p>
          </div>

          {booking.laborId && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-slate-500 text-xs mb-1">Assigned Labour</p>
              <p className="font-semibold">{booking.laborId?.fullName}</p>
              <p className="text-slate-600">{booking.laborId?.phone}</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs">Start OTP</p>
              <p className="font-mono font-semibold">{booking.startOtp || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Completion OTP</p>
              <p className="font-mono font-semibold">{booking.completionOtp || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs mb-2">Start Work Image</p>
              {booking.startWorkImage ? (
                <img src={booking.startWorkImage} alt="Start Work" className="w-full h-auto rounded-lg shadow-sm border border-slate-200" />
              ) : (
                <div className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                  Not uploaded
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-2">End Work Image</p>
              {booking.endWorkImage ? (
                <img src={booking.endWorkImage} alt="End Work" className="w-full h-auto rounded-lg shadow-sm border border-slate-200" />
              ) : (
                <div className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                  Not uploaded
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 bg-slate-50 p-3 rounded-lg">
            <p className="font-extrabold text-sm mb-2">Financial Breakdown</p>
            <div className="flex justify-between text-xs text-slate-600 py-1">
              <span>Base Price:</span>
              <span className="font-semibold text-slate-900">₹{booking.basePrice}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 py-1">
              <span>Platform Fee:</span>
              <span className="font-semibold text-slate-900">₹{booking.platformFee}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 py-1">
              <span>Taxes:</span>
              <span className="font-semibold text-slate-900">₹{booking.taxes}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-900 py-1 font-bold border-t border-slate-200 mt-1 pt-2">
              <span>Total Amount:</span>
              <span>₹{booking.totalAmount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 py-1 mt-2">
              <span>Commission (Admin):</span>
              <span className="font-semibold text-brand">₹{booking.commissionAmount}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 py-1">
              <span>Labour Share:</span>
              <span className="font-semibold text-green-600">₹{booking.laborShare}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IndividualBookingsTab() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedBooking, setSelectedBooking] = useState(null)

  const { data, isLoading, isError } = useGetAdminBookingsQuery(
    { status: statusFilter },
  )

  const bookings = data?.bookings ?? []

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
                statusFilter === f.value
                  ? 'bg-brand text-white ring-brand'
                  : 'bg-white text-slate-600 ring-slate-200 hover:ring-brand/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <GlassPanel className="p-6">
          <p className="text-sm text-slate-500">Loading bookings…</p>
        </GlassPanel>
      ) : null}

      {isError ? (
        <GlassPanel className="border-rose-200 p-6">
          <p className="text-sm font-semibold text-rose-800">Failed to load bookings.</p>
        </GlassPanel>
      ) : null}

      {!isLoading && !isError && bookings.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-700">No bookings in this filter.</p>
        </GlassPanel>
      ) : null}

      <ul className="space-y-4">
        {bookings.map((b) => (
          <li key={b._id}>
            <GlassPanel className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{b.serviceId?.name || 'Service'} ({b.type})</p>
                  <p className="text-xs text-slate-500">
                    User: {b.userId?.fullName || 'Unknown'} · {b.userId?.phone}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Location: {b.address?.locationText || 'No location'}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-700">
                    Status: {b.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-bold text-brand hover:border-brand/30 hover:bg-brand/5 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </GlassPanel>
          </li>
        ))}
      </ul>

      {selectedBooking && (
        <BookingDetailsModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}
    </div>
  )
}

export function AdminBookingsPage() {
  const [activeTab, setActiveTab] = useState('corporate')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Bookings & requests</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage individual bookings and corporate workforce requests.
        </p>
      </div>

      <div className="flex items-center space-x-4 border-b border-slate-200">
        <button
          className={`pb-2 text-sm font-bold border-b-2 transition ${
            activeTab === 'corporate'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('corporate')}
        >
          Corporate Requests
        </button>
        <button
          className={`pb-2 text-sm font-bold border-b-2 transition ${
            activeTab === 'individual'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('individual')}
        >
          Individual Bookings
        </button>
      </div>

      {activeTab === 'corporate' && <CorporateRequestsTab />}
      {activeTab === 'individual' && <IndividualBookingsTab />}
    </div>
  )
}
