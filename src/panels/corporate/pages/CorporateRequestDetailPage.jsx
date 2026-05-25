import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { useGetRequestQuery } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CorporateRequestDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useGetRequestQuery(id, { skip: !id })

  const request = data?.request
  const assignments = data?.assignments ?? []

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
            <li key={i} className="flex justify-between text-sm">
              <span className="text-slate-600">Category</span>
              <span className="font-bold text-slate-900">× {line.quantity}</span>
            </li>
          ))}
        </ul>
      </AppSurface>

      <AppSurface>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" aria-hidden />
          <p className="text-sm font-extrabold text-slate-900">Assigned roster</p>
        </div>
        {assignments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No workers assigned yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {assignments.map((a) => (
              <li key={a._id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {a.labourId?.fullName || 'Worker'}
                  </p>
                  <p className="text-xs text-slate-500">{a.labourId?.phone || a.status}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AppSurface>
    </div>
  )
}
