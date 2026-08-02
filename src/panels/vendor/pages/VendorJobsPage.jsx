import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.js'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { VendorJobsHero } from '../../../components/vendor/VendorJobsHero.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { isVendorPanelUnlocked } from '../../../lib/vendorDemo.js'
import { filterVendorJobs, VENDOR_DUMMY_ALLOCATIONS } from '../../../lib/vendorDummyData.js'
import { useEffect } from 'react'
import { vendorApi } from '../../../api/vendorApi.js'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Done' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function VendorJobsPage() {
  const { user } = useAuth()
  const reduce = useReducedMotion()
  const verified = isVendorPanelUnlocked(user)
  const [tab, setTab] = useState('all')
  const [rawAllocations, setRawAllocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const fetchJobs = async () => {
    try {
      const res = await vendorApi.getJobs()
      setRawAllocations(res?.data?.allocations || [])
    } catch (err) {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const allocations = useMemo(() => filterVendorJobs(rawAllocations, tab), [rawAllocations, tab])
  const pendingCount = rawAllocations.filter((a) => !a.vendorAcceptedAt && !a.vendorRejectedAt).length
  const activeCount = filterVendorJobs(rawAllocations, 'active').length

  const handleAccept = async (id) => {
    setAccepting(true)
    try {
      await vendorApi.acceptJob(id)
      await fetchJobs()
    } catch {
      alert('Failed to accept request')
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async (id) => {
    setRejecting(true)
    try {
      await vendorApi.rejectJob(id)
      await fetchJobs()
    } catch {
      alert('Failed to reject request')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout
        hero={<VendorJobsHero pendingCount={pendingCount} activeCount={activeCount} verified={verified} />}
      >
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                tab === t.id ? 'bg-brand text-white shadow-md' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-500">Loading jobs…</div>
        ) : null}
        {isError ? (
          <div className="py-20 text-center text-sm text-rose-800">Could not load jobs.</div>
        ) : null}

        {allocations.length === 0 ? (
          <AppEmptyState icon={ClipboardList} title="No jobs here" subtitle="Try another filter or check back later." />
        ) : null}

        <ul className="space-y-3">
          {allocations.map((a) => {
            const req = a.requestId
            const pending = !a.vendorAcceptedAt
            const clientName = req?.clientId?.corporateProfile?.companyName || req?.clientId?.fullName || 'Corporate Client'

            // Calculate total vendor price if crew selected
            const hasCrew = req?.preferredCrewIds?.length > 0
            const totalVendorPrice = hasCrew ? req.preferredCrewIds.reduce((sum, w) => sum + (w.services?.[0]?.price || 0), 0) : 0

            return (
              <li key={a._id}>
                <VendorCard className="space-y-3">
                  <Link to={`/vendor/jobs/${a._id}`} className="block min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{req?.reference}</p>
                        <p className="truncate text-xs font-bold text-brand">{clientName}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{req?.locationText}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {formatDate(req?.startDate)}
                          {req?.endDate ? ` – ${formatDate(req.endDate)}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                    </div>
                  </Link>

                  {/* Chosen Labourers */}
                  {pending && hasCrew && (
                    <div className="rounded-lg bg-slate-50 p-3 mt-3 border border-slate-100">
                      <p className="text-xs font-bold text-slate-700 mb-2">Requested Crew Members:</p>
                      <div className="space-y-2">
                        {req.preferredCrewIds.map(worker => (
                          <div key={worker._id} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-600">{worker.fullName} ({worker.category})</span>
                            <span className="font-bold text-slate-800">₹{worker.services?.[0]?.price || 0}/day</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-700">Total Vendor Earning:</span>
                        <span className="text-emerald-600">₹{totalVendorPrice}/day</span>
                      </div>
                    </div>
                  )}

                  {!pending && <PipelineTimeline status={req?.status} title="Status" compact />}
                  
                  {pending ? (
                    <div className="flex gap-2 w-full mt-2">
                      <AppPrimaryButton type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700" loading={accepting} onClick={() => void handleAccept(a._id)}>
                        Accept
                      </AppPrimaryButton>
                      <button 
                        type="button" 
                        disabled={rejecting}
                        className="flex-1 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition" 
                        onClick={() => void handleReject(a._id)}
                      >
                        {rejecting ? '...' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <AppBadge variant="emerald" uppercase={false}>
                      Accepted
                    </AppBadge>
                  )}
                </VendorCard>
              </li>
            )
          })}
        </ul>
      </VendorPageLayout>
    </motion.div>
  )
}
