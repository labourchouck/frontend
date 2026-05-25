import { Clock } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { useGetAttendanceQuery, useVerifyAttendanceMutation } from '../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminAttendancePage() {
  const { data, isLoading, isError } = useGetAttendanceQuery()
  const [verify, { isLoading: verifying }] = useVerifyAttendanceMutation()
  const records = data?.records ?? []

  const handleVerify = async (id) => {
    try {
      await verify({ id, status: 'present' }).unwrap()
    } catch {
      /* later */
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Attendance</h1>
        <p className="mt-2 text-sm text-slate-600">All records — verify for billing.</p>
      </div>

      {isLoading ? (
        <GlassPanel className="p-6">
          <p className="text-sm text-slate-500">Loading…</p>
        </GlassPanel>
      ) : null}

      {isError ? (
        <GlassPanel className="p-6 text-rose-800">Could not load attendance.</GlassPanel>
      ) : null}

      <ul className="space-y-3">
        {records.map((r) => (
          <li key={r._id}>
            <GlassPanel className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Clock className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.labourId?.fullName || 'Worker'}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(r.shiftDate)} · {r.status} · verified: {r.verifiedBy || '—'}
                  </p>
                  {r.billableUnits != null ? (
                    <p className="text-xs text-slate-500">Billable: {r.billableUnits}</p>
                  ) : null}
                </div>
              </div>
              {!r.verifiedAt ? (
                <AppPrimaryButton type="button" loading={verifying} onClick={() => handleVerify(r._id)}>
                  Verify present
                </AppPrimaryButton>
              ) : (
                <span className="text-xs font-bold text-emerald-700">Verified</span>
              )}
            </GlassPanel>
          </li>
        ))}
      </ul>
    </div>
  )
}
