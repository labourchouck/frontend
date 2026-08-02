import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users, Star, Loader2 } from 'lucide-react'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { useGetRequestQuery, useRateCorporateAssignmentMutation } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CorporateRequestDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useGetRequestQuery(id, { skip: !id })
  const [rateAssignment, { isLoading: isRating }] = useRateCorporateAssignmentMutation()

  const [ratingState, setRatingState] = useState({ id: null, rating: 5, comment: '' })

  const request = data?.request
  const assignments = data?.assignments ?? []
  const platformFeeConfig = data?.platformFeeConfig

  const days = request ? Math.ceil((new Date(request.endDate || request.startDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 1
  const basePriceTotal = (request?.lines || []).reduce((sum, line) => {
    const p = line.categoryId?.adminPrice || 0
    return sum + (p * line.quantity * days)
  }, 0)

  let platformFee = 0
  if (platformFeeConfig?.isActive) {
    if (platformFeeConfig.type === 'fixed') {
      platformFee = platformFeeConfig.value
    } else {
      platformFee = (basePriceTotal * platformFeeConfig.value) / 100
    }
  }
  const estimatedTotal = basePriceTotal + platformFee

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
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reference</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-900">{request.reference}</h2>
        {request.preferredVendorId && (
          <div className="mt-1 text-sm font-bold text-brand">
            Sent to: {request.preferredVendorId.contractorProfile?.businessName || request.preferredVendorId.fullName}
          </div>
        )}
        <p className="mt-2 text-sm text-slate-600">
          {formatDate(request.startDate)}
          {request.endDate ? ` – ${formatDate(request.endDate)}` : ''}
        </p>
        {request.locationText ? <p className="mt-1 text-xs text-slate-500">{request.locationText}</p> : null}
      </AppSurface>

      <PipelineTimeline status={request.status} />

      <AppSurface>
        <p className="text-sm font-extrabold text-slate-900">Skill lines</p>
        <ul className="mt-3 space-y-2">
          {(request.lines ?? []).map((line, i) => (
            <li key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
              <div>
                <span className="font-bold text-slate-800">{line.categoryId?.name || 'Category'}</span>
                <span className="text-slate-500 ml-2">× {line.quantity}</span>
              </div>
              <span className="font-medium text-slate-900">
                ₹{((line.categoryId?.adminPrice || 0) * line.quantity * days).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-between text-sm mb-2 text-slate-600">
            <span>Platform Fee</span>
            <span>₹{Math.round(platformFee).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-extrabold text-slate-900 text-base">
            <span>Estimated Total</span>
            <span>₹{Math.round(estimatedTotal).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </AppSurface>

      <AppSurface>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" aria-hidden />
          <p className="text-sm font-extrabold text-slate-900">Assigned roster</p>
        </div>
        {assignments.length === 0 ? (
          <div>
            <p className="mt-3 text-sm text-slate-500">No workers assigned yet.</p>
            {request.preferredCrewIds?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600 uppercase mb-3">Requested Labours</p>
                <ul className="space-y-2">
                  {request.preferredCrewIds.map((crew) => (
                    <li key={crew._id} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{crew.fullName}</p>
                        <p className="text-xs text-slate-500">{crew.phone}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Requested
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {assignments.map((a) => (
              <li key={a._id} className="flex flex-col py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex w-full items-start justify-between py-1">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {a.labourId?.fullName || 'Worker'}
                    </p>
                    <p className="text-xs text-slate-500">{a.labourId?.phone || a.status}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {a.status}
                    </span>
                    {a.status !== 'CANCELLED' && ratingState.id !== a._id && (
                      <button 
                        onClick={() => setRatingState({ id: a._id, rating: 5, comment: '' })}
                        className="text-[10px] font-bold text-brand uppercase tracking-wider hover:underline"
                      >
                        Rate Worker
                      </button>
                    )}
                  </div>
                </div>
                
                {/* INLINE RATING FORM */}
                {ratingState.id === a._id && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2">Rate {a.labourId?.fullName || 'Worker'}</p>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setRatingState(prev => ({ ...prev, rating: star }))}
                        >
                          <Star className={`h-5 w-5 ${ratingState.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add a comment..."
                      className="w-full text-xs p-2 rounded border border-slate-200 mb-2 outline-none focus:ring-1 focus:ring-brand"
                      value={ratingState.comment}
                      onChange={(e) => setRatingState(prev => ({ ...prev, comment: e.target.value }))}
                    />
                    <div className="flex items-center gap-2">
                      <AppPrimaryButton 
                        onClick={() => handleRate(a._id)} 
                        disabled={isRating}
                        className="!py-1.5 !px-3 !text-[10px]"
                      >
                        {isRating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Submit Rating
                      </AppPrimaryButton>
                      <button 
                        onClick={() => setRatingState({ id: null, rating: 5, comment: '' })}
                        className="text-[10px] font-bold text-slate-500 uppercase hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </AppSurface>
    </div>
  )
}
