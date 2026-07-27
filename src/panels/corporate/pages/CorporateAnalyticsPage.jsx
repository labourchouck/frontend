import { BarChart3, Building2, ClipboardList, Clock, FileText, IndianRupee } from 'lucide-react'
import { CORPORATE_STATUS } from '../../../constants/userRoles.js'
import { ApprovalGate } from '../../../components/shared/ApprovalGate.jsx'
import { OpsStatCard } from '../../../components/shared/OpsStatCard.jsx'
import { useAuth } from '../../../hooks/useAuth.js'
import { useGetCorporateDashboardQuery, useGetCorporateAnalyticsQuery } from '../../../store/api/workforceApi.js'

export function CorporateAnalyticsPage() {
  const { user } = useAuth()
  const approved = user?.corporateProfile?.status === CORPORATE_STATUS.APPROVED
  const { data, isLoading } = useGetCorporateDashboardQuery(undefined, { skip: !approved })
  const { data: analyticsData, isLoading: analyticsLoading } = useGetCorporateAnalyticsQuery(undefined, { skip: !approved })

  if (!approved) {
    return (
      <ApprovalGate
        title="Analytics locked"
        message="Complete corporate verification to view deployment and billing analytics."
        profileTo="/corporate/profile"
      />
    )
  }

  const stats = data?.stats || {}

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Insights</p>
        <h2 className="text-lg font-extrabold text-slate-900">Analytics</h2>
        <p className="mt-1 text-sm text-slate-600">Executive snapshot from your corporate dashboard.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OpsStatCard
          label="Active projects"
          value={isLoading ? '—' : stats.activeProjects ?? 0}
          icon={Building2}
          tone="brand"
        />
        <OpsStatCard
          label="Open requests"
          value={isLoading ? '—' : stats.openRequests ?? 0}
          icon={ClipboardList}
        />
        <OpsStatCard
          label="Workers deployed"
          value={isLoading ? '—' : stats.activeWorkers ?? 0}
          icon={Clock}
        />
        <OpsStatCard
          label="Present today"
          value={isLoading ? '—' : stats.attendanceToday ?? 0}
          icon={BarChart3}
        />
        <OpsStatCard
          label="Invoices due"
          value={isLoading ? '—' : stats.invoicesDue ?? 0}
          icon={FileText}
          tone="warn"
        />
        <OpsStatCard
          label="Total Spend"
          value={analyticsLoading ? '—' : `₹${analyticsData?.totalSpend?.toLocaleString() || 0}`}
          icon={IndianRupee}
          tone="brand"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">Attendance Trends</h3>
        {analyticsLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading trends...</p>
        ) : analyticsData?.attendanceTrends?.length > 0 ? (
          <div className="mt-4 space-y-3">
            {analyticsData.attendanceTrends.map((trend, i) => {
              const total = trend.present + trend.absent || 1
              const presentPct = Math.round((trend.present / total) * 100)
              
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{new Date(trend.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-slate-500">{trend.present} Present / {trend.absent} Absent</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${presentPct}%` }} />
                    <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${100 - presentPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No attendance data available.</p>
        )}
      </div>
    </div>
  )
}
