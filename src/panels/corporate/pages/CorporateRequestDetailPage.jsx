import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users, Star, Loader2, Clock } from 'lucide-react'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { useGetRequestQuery, useRateCorporateAssignmentMutation } from '../../../store/api/workforceApi.js'
import { SharedAttendanceDrawer } from '../../../components/shared/SharedAttendanceDrawer.jsx'
import { useAuth } from '../../../hooks/useAuth.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CorporateRequestDetailPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const { data, isLoading, isError } = useGetRequestQuery(id, { skip: !id })
  const [rateAssignment, { isLoading: isRating }] = useRateCorporateAssignmentMutation()

  const [ratingState, setRatingState] = useState({ id: null, rating: 5, comment: '' })
  const [selectedAttendanceReqId, setSelectedAttendanceReqId] = useState(null)

  const request = data?.request
  const assignments = data?.assignments ?? []
  const platformFeeConfig = data?.platformFeeConfig

  const days = data?.pricingSummary?.days || (request ? Math.max(1, Math.ceil((new Date(request.endDate || request.startDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1) : 1)

  // Extract service breakdown or fallback
  const serviceBreakdown = data?.serviceBreakdown?.length
    ? data.serviceBreakdown
    : (request?.lines || []).map(line => {
      const servName = line.serviceName || line.categoryId?.name || line.categoryName || 'Specialist Labour'
      const catName = line.categoryName || line.categoryId?.name || ''
      const adminPrice = Number(line.adminPrice || line.categoryId?.adminPrice || 0)
      const qty = Number(line.quantity) || 1
      const totalPerDay = line.dailyTotal || (adminPrice * qty)
      const totalForDuration = line.durationTotal || (totalPerDay * days)
      return {
        serviceName: servName,
        categoryName: catName,
        quantity: qty,
        adminPricePerDay: adminPrice,
        totalPricePerDay: totalPerDay,
        totalPriceForDuration: totalForDuration,
        workers: []
      }
    })

  const basePriceTotal = data?.pricingSummary?.basePriceTotal ?? serviceBreakdown.reduce((sum, item) => sum + (item.totalPriceForDuration || (item.totalPricePerDay * days)), 0)
  const platformFee = data?.pricingSummary?.platformFee ?? (platformFeeConfig?.isActive ? (platformFeeConfig.type === 'fixed' ? platformFeeConfig.value : (basePriceTotal * platformFeeConfig.value) / 100) : 100)
  const estimatedTotal = data?.pricingSummary?.estimatedTotal ?? (basePriceTotal + platformFee)

  const handleRate = async (assignmentId) => {
    try {
      await rateAssignment({
        assignmentId,
        rating: ratingState.rating,
        comment: ratingState.comment
      }).unwrap()
      alert('Rating submitted successfully')
      setRatingState({ id: null, rating: 5, comment: '' })
    } catch (err) {
      console.error(err)
      alert('Failed to submit rating')
    }
  }

  if (isLoading) {
    return (
      <AppSurface>
        <p className="text-sm text-slate-500">Loading request…</p>
      </AppSurface>
    )
  }

  if (isError || !request) {
    return (
      <AppSurface className="border-rose-200/90">
        <p className="text-sm font-semibold text-rose-800">Request not found.</p>
        <Link to="/corporate/requests" className="mt-3 inline-block text-sm font-bold text-brand">
          Back
        </Link>
      </AppSurface>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <Link to="/corporate/requests" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Requests
      </Link>

      <AppSurface>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>

            <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">{request.reference}</h2>
            {data?.allocation?.vendorId && (
              <div className="mt-1 text-sm font-bold text-brand">
                Assigned Vendor: {data.allocation.vendorId.contractorProfile?.businessName || data.allocation.vendorId.fullName}
              </div>
            )}
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(request.startDate)}
              {request.endDate ? ` – ${formatDate(request.endDate)}` : ''} · <span className="font-semibold">{days} {days === 1 ? 'day' : 'days'}</span>
            </p>
            {(request.shiftStart || request.shiftEnd) && (
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Time: {request.shiftStart || 'N/A'} - {request.shiftEnd || 'N/A'}
              </p>
            )}
            {request.locationText ? <p className="mt-1 text-xs text-slate-500">{request.locationText}</p> : null}
            {request.billingMode && (
              <p className="mt-1 text-xs text-slate-500 font-medium">Billing Mode: <span className="uppercase">{request.billingMode.replace('_', ' ')}</span></p>
            )}
            {request.notes && (
              <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100"><span className="font-bold">Notes:</span> {request.notes}</p>
            )}
          </div>

          {user?.role === 'corporate' && (
            <Link
              to={`/corporate/attendance?date=${request.startDate ? new Date(request.startDate).toISOString().split('T')[0] : ''}`}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-brand text-white px-4 py-2.5 text-xs font-bold shadow-sm hover:bg-brand-600 transition-all shrink-0"
            >
              <Clock className="h-4 w-4" />
              Daily Attendance
            </Link>
          )}
        </div>
      </AppSurface>

      <PipelineTimeline status={request.status} />

      <AppSurface>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-900">Booked Services & Pricing</p>
          <span className="text-xs font-semibold text-slate-500">{days} {days === 1 ? 'day' : 'days'} duration</span>
        </div>

        <ul className="mt-3 space-y-3">
          {serviceBreakdown.map((item, i) => (
            <li key={i} className="flex items-start justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{item.serviceName}</span>
                  <span className="rounded-md bg-brand/10 text-brand px-1.5 py-0.5 text-xs font-bold">
                    × {item.quantity}
                  </span>
                </div>
                {item.categoryName && item.categoryName !== item.serviceName && (
                  <p className="text-xs text-slate-400 mt-0.5">{item.categoryName}</p>
                )}
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Rate: ₹{item.adminPricePerDay.toLocaleString('en-IN')} / day
                  {item.quantity > 1 ? ` · (₹${item.totalPricePerDay.toLocaleString('en-IN')} / day total)` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-slate-900 text-sm">
                  ₹{(item.totalPriceForDuration || (item.totalPricePerDay * days)).toLocaleString('en-IN')}
                </span>
                <span className="block text-[11px] text-slate-400">for {days} {days === 1 ? 'day' : 'days'}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Base Service Total ({days} {days === 1 ? 'day' : 'days'})</span>
            <span className="font-medium text-slate-800">₹{basePriceTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Platform Fee</span>
            <span className="font-medium text-slate-800">₹{Math.round(platformFee).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-extrabold text-slate-900 text-base pt-2 border-t border-slate-100">
            <span>Estimated Total</span>
            <span className="text-brand font-black text-lg">₹{Math.round(estimatedTotal).toLocaleString('en-IN')}</span>
          </div>

          {['completed', 'billing'].includes(request.status) && (
            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
              <Link
                to="/corporate/billing"
                className="w-full sm:w-auto text-sm font-bold shadow-md inline-flex justify-center items-center rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand/90 transition"
              >
                Make Payment
              </Link>
            </div>
          )}
        </div>
      </AppSurface>

      <AppSurface>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" aria-hidden />
            <p className="text-sm font-extrabold text-slate-900">Assigned roster</p>
          </div>
          {assignments.length > 0 && (
            <button
              onClick={() => setSelectedAttendanceReqId(request._id)}
              className="text-[10px] font-bold text-brand hover:text-white hover:bg-brand bg-brand/10 px-2.5 py-1 rounded-full transition-all duration-300"
            >
              View Attendance
            </button>
          )}
        </div>
        <div>
          {request.preferredCrewIds?.length > 0 && (
            <ul className="mt-3 space-y-3">
              {request.preferredCrewIds.map((crew) => {
                const serv = crew.services?.[0]
                const categoryName = crew.category || crew.categoryName || ''
                const serviceName = serv?.name || crew.serviceName || categoryName || 'Labour'
                const adminPrice = Number(crew.adminPrice ?? serv?.adminPrice ?? serv?.price ?? 0)

                return (
                  <li key={crew._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{crew.fullName}</p>
                      </div>
                      {categoryName ? (
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{categoryName}</p>
                      ) : null}
                      {serviceName && serviceName !== categoryName ? (
                        <p className="text-xs text-slate-500 font-medium">{serviceName}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                        ₹{adminPrice.toLocaleString('en-IN')} / day
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </AppSurface>

      <SharedAttendanceDrawer
        requestId={selectedAttendanceReqId}
        onClose={() => setSelectedAttendanceReqId(null)}
      />
    </div>
  )
}
