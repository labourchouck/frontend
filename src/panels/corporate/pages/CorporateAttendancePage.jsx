import { Clock } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useGetAttendanceQuery } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function CorporateAttendancePage() {
  const { data, isLoading, isError } = useGetAttendanceQuery()
  const records = data?.records ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations</p>
        <h2 className="text-lg font-extrabold text-slate-900">Attendance</h2>
        <p className="mt-1 text-sm text-slate-600">Site-wise logs for billing and disputes.</p>
      </div>

      {isLoading ? (
        <AppSurface>
          <p className="text-sm text-slate-500">Loading attendance…</p>
        </AppSurface>
      ) : null}

      {isError ? (
        <AppSurface className="border-rose-200/90 bg-rose-50/40">
          <p className="text-sm font-semibold text-rose-800">Could not load attendance.</p>
        </AppSurface>
      ) : null}

      {!isLoading && !isError && records.length === 0 ? (
        <AppEmptyState
          icon={Clock}
          title="No attendance records"
          subtitle="Records appear when workers check in on assigned jobs."
        />
      ) : null}

      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r._id}>
            <AppSurface>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.labourId?.fullName || 'Worker'}</p>
                  <p className="text-xs text-slate-500">{formatDate(r.shiftDate)}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                  {r.status}
                </span>
              </div>
              {r.billableUnits != null ? (
                <p className="mt-2 text-xs text-slate-500">Billable units: {r.billableUnits}</p>
              ) : null}
            </AppSurface>
          </li>
        ))}
      </ul>
    </div>
  )
}
