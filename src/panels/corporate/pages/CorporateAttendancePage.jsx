import { Clock, Users, Building2 } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useGetCorporateVendorAttendanceQuery } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function CorporateAttendancePage() {
  const { data, isLoading, isError } = useGetCorporateVendorAttendanceQuery()
  const vendors = data?.vendors ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations</p>
        <h2 className="text-lg font-extrabold text-slate-900">Vendor Attendance</h2>
        <p className="mt-1 text-sm text-slate-600">Track vendor-supplied workforce attendance for billing.</p>
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

      {!isLoading && !isError && vendors.length === 0 ? (
        <AppEmptyState
          icon={Clock}
          title="No attendance records"
          subtitle="Vendor attendance will appear here when their crew checks in."
        />
      ) : null}

      <ul className="space-y-4">
        {vendors.map((v) => (
          <li key={v.vendor?._id || Math.random()}>
            <AppSurface className="overflow-hidden p-0">
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      {v.vendor?.businessName || v.vendor?.fullName || 'Unknown Vendor'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 ml-6">
                      Contractor: {v.vendor?.fullName} • {v.vendor?.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-brand" /> {v.summary?.totalCrew || 0}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-green-600">{v.summary?.present || 0} P</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-red-500">{v.summary?.absent || 0} A</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Crew Attendance</h4>
                {v.attendanceRecords?.length > 0 ? (
                  <ul className="space-y-2">
                    {v.attendanceRecords.map((r) => (
                      <li key={r._id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{r.labourId?.fullName || 'Worker'}</span>
                          <span className="text-xs text-slate-500">Phone: {r.labourId?.phone || '—'}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {r.status}
                          </span>
                          {r.billableUnits != null && r.status === 'present' && (
                            <span className="text-[10px] font-medium text-slate-500">{r.billableUnits} units</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No crew attendance logged for today.</p>
                )}
              </div>
            </AppSurface>
          </li>
        ))}
      </ul>
    </div>
  )
}
