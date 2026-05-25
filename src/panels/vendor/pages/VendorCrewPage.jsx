import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Users } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useGetVendorCrewQuery } from '../../../store/api/workforceApi.js'

export function VendorCrewPage() {
  const { data, isLoading, isError } = useGetVendorCrewQuery()
  const crew = data?.crew ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workforce</p>
          <h2 className="text-lg font-extrabold text-slate-900">Crew</h2>
        </div>
        <Link to="/vendor/crew/new">
          <AppPrimaryButton type="button">
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </AppPrimaryButton>
        </Link>
      </div>

      {isLoading ? (
        <AppSurface>
          <p className="text-sm text-slate-500">Loading crew…</p>
        </AppSurface>
      ) : null}

      {isError ? (
        <AppSurface className="border-rose-200/90 bg-rose-50/40">
          <p className="text-sm font-semibold text-rose-800">Could not load crew.</p>
        </AppSurface>
      ) : null}

      {!isLoading && !isError && crew.length === 0 ? (
        <AppEmptyState
          icon={Users}
          title="No crew linked"
          subtitle="Link workers by phone — they must already be registered as labour."
        />
      ) : null}

      <ul className="space-y-2">
        {crew.map((w) => (
          <li key={w._id}>
            <AppSurface className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{w.fullName || 'Worker'}</p>
                <p className="text-xs text-slate-500">{w.phone}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
            </AppSurface>
          </li>
        ))}
      </ul>
    </div>
  )
}
