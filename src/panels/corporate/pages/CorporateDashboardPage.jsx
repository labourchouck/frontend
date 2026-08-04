import { Link } from 'react-router-dom'
import { Building2, ClipboardList, Clock, FileText, Plus } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { CORPORATE_STATUS } from '../../../constants/userRoles.js'
import { ApprovalGate } from '../../../components/shared/ApprovalGate.jsx'
import { OpsStatCard } from '../../../components/shared/OpsStatCard.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useGetCorporateDashboardQuery, useGetCorporateBannersQuery } from '../../../store/api/workforceApi.js'

export function CorporateDashboardPage() {
  const { user } = useAuth()
  const approved = user?.corporateProfile?.status === CORPORATE_STATUS.APPROVED
  const { data, isLoading } = useGetCorporateDashboardQuery(undefined, { skip: !approved })
  const { data: bannersData, isLoading: isLoadingBanners } = useGetCorporateBannersQuery(undefined, { skip: !approved })

  if (!approved) {
    return (
      <div className="space-y-4">
        <ApprovalGate
          title="Corporate approval required"
          message="Upload company documents on your profile. Operations will verify your account before projects and bulk requests unlock."
          profileTo="/corporate/profile"
        />
      </div>
    )
  }

  const stats = data?.stats || {}

  return (
    <div className="space-y-5">
      <AppSurface flush tone="brandWash" className="border-slate-800/10 bg-slate-900 text-white relative group">
        {/* Background Banners */}
        {!isLoadingBanners && bannersData?.banners?.length > 0 && (
          <div className="absolute inset-0 z-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {bannersData.banners.map((banner) => (
              <img
                key={banner._id}
                src={banner.imageUrl}
                alt="Corporate Banner"
                className="w-full h-full object-cover snap-center shrink-0"
              />
            ))}
          </div>
        )}


        {/* Content Wrapper */}
        <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-end gap-2 min-h-[140px]">
          <Link to="/corporate/requests/new" className="inline-block mt-auto">
            <AppPrimaryButton type="button" size="sm" className="bg-brand text-white border-none shadow-sm hover:bg-brand-600">
              <Plus className="h-3.5 w-3.5" />
              New workforce request
            </AppPrimaryButton>
          </Link>
          <Link to="/corporate/attendance" className="inline-block mt-auto">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs"
            >
              <Clock className="h-3.5 w-3.5 text-emerald-300" />
              Daily Attendance
            </button>
          </Link>
        </div>
      </AppSurface>

      <div className="grid grid-cols-2 gap-3">
        <OpsStatCard label="Active projects" value={isLoading ? '—' : stats.activeProjects ?? 0} icon={Building2} tone="brand" />
        <OpsStatCard label="Open requests" value={isLoading ? '—' : stats.openRequests ?? 0} icon={ClipboardList} />
        <OpsStatCard label="Workers deployed" value={isLoading ? '—' : stats.activeWorkers ?? 0} icon={Clock} />
        <OpsStatCard label="Invoices due" value={isLoading ? '—' : stats.invoicesDue ?? 0} icon={FileText} tone="warn" />
      </div>
    </div>
  )
}


