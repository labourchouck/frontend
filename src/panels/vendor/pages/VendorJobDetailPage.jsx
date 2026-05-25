import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { useAcceptVendorJobMutation, useGetVendorJobsQuery } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function VendorJobDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useGetVendorJobsQuery()
  const [acceptJob, { isLoading: accepting }] = useAcceptVendorJobMutation()

  const allocation = (data?.allocations ?? []).find((a) => String(a._id) === String(id))
  const req = allocation?.requestId

  if (isLoading) {
    return (
      <AppSurface>
        <p className="text-sm text-slate-500">Loading job…</p>
      </AppSurface>
    )
  }

  if (!allocation) {
    return (
      <AppSurface className="border-rose-200/90">
        <p className="text-sm font-semibold text-rose-800">Job not found.</p>
        <Link to="/vendor/jobs" className="mt-3 inline-block text-sm font-bold text-brand">
          Back
        </Link>
      </AppSurface>
    )
  }

  const pending = !allocation.vendorAcceptedAt

  return (
    <div className="space-y-4 pb-8">
      <Link to="/vendor/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Jobs
      </Link>

      <AppSurface>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocation</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-900">{req?.reference || 'Supply job'}</h2>
        <p className="mt-2 text-sm text-slate-600">{req?.locationText || 'Location TBD'}</p>
        <p className="mt-1 text-xs text-slate-500">
          {formatDate(req?.startDate)}
          {req?.endDate ? ` – ${formatDate(req?.endDate)}` : ''}
        </p>
      </AppSurface>

      {req?.status ? <PipelineTimeline status={req.status} /> : null}

      <AppSurface>
        <p className="text-sm font-extrabold text-slate-900">Deployment notes</p>
        <p className="mt-2 text-sm text-slate-600">{allocation.notes || 'No notes from operations.'}</p>
        {allocation.deployedAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Deployed {new Date(allocation.deployedAt).toLocaleString('en-IN')}
          </p>
        ) : null}
        {allocation.vendorAcceptedAt ? (
          <p className="mt-1 text-xs font-bold text-emerald-700">
            Accepted {new Date(allocation.vendorAcceptedAt).toLocaleString('en-IN')}
          </p>
        ) : null}
      </AppSurface>

      {pending ? (
        <AppPrimaryButton type="button" className="w-full" loading={accepting} onClick={() => acceptJob(id)}>
          Accept job
        </AppPrimaryButton>
      ) : null}
    </div>
  )
}
