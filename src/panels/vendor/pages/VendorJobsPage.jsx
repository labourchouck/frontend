import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, ClipboardList, Clock } from 'lucide-react'
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
import { useAcceptVendorJobMutation } from '../../../store/api/workforceApi.js'

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
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const verified = isVendorPanelUnlocked(user)
  const [tab, setTab] = useState('all')
  const [rawAllocations, setRawAllocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [acceptVendorJob] = useAcceptVendorJobMutation()

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
      await acceptVendorJob(id).unwrap()
      await fetchJobs()
      navigate('/vendor/attendance')
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
            
            // The user requested to delete (hide) the "Accepted" cards from this list permanently, except completed ones
            if (!pending && req?.status !== 'completed' && req?.status !== 'billing') {
              return null;
            }

            const clientName = req?.clientId?.corporateProfile?.companyName || req?.clientId?.fullName || 'Corporate Client'

            // Calculate total duration in days
            const days = (() => {
              if (!req?.startDate) return 1
              const start = new Date(req.startDate)
              const end = req.endDate ? new Date(req.endDate) : start
              const diffTime = Math.abs(end.getTime() - start.getTime())
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
              return Math.max(1, diffDays)
            })()

            // Calculate total vendor price if crew selected
            const hasCrew = req?.preferredCrewIds?.length > 0
            const totalVendorPricePerDay = hasCrew
              ? req.preferredCrewIds.reduce((sum, w) => sum + (w.services?.[0]?.price || w.price || 0), 0)
              : 0
            const totalVendorEarning = totalVendorPricePerDay * days

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
                          <span className="ml-1.5 font-bold text-slate-500">
                            ({days} {days === 1 ? 'day' : 'days'})
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                    </div>
                  </Link>

                  {/* Chosen Labourers */}
                  {hasCrew && (
                    <div className="rounded-xl bg-slate-50 p-3.5 mt-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-700">Requested Crew Members:</p>
                        <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                          {days} {days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {req.preferredCrewIds.map((worker) => {
                          const serviceName = worker.services?.[0]?.name || worker.serviceName || worker.category || 'Specialist Labour'
                          const dailyPrice = worker.services?.[0]?.price || worker.price || 0
                          const workerTotal = dailyPrice * days
                          return (
                            <div key={worker._id} className="flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-600">
                                {worker.fullName} ({serviceName})
                              </span>
                              <div className="text-right">
                                <span className="font-bold text-slate-800">
                                  ₹{workerTotal.toLocaleString('en-IN')}
                                </span>
                                {days > 1 ? (
                                  <span className="block text-[10px] text-slate-400">
                                    ₹{dailyPrice.toLocaleString('en-IN')}/day × {days}d
                                  </span>
                                ) : (
                                  <span className="block text-[10px] text-slate-400">/day</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                        <div>
                          <span className="text-slate-700 block">Total Vendor Earning:</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            (₹{totalVendorPricePerDay.toLocaleString('en-IN')}/day for {days} {days === 1 ? 'day' : 'days'})
                          </span>
                        </div>
                        <span className="text-emerald-600 text-base font-black">
                          ₹{totalVendorEarning.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {!pending && req?.status === 'completed' && <PipelineTimeline status={req?.status} title="Status" compact />}
                  
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
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <AppBadge variant="emerald" uppercase={false}>
                          Accepted
                        </AppBadge>
                        <Link
                          to={`/vendor/attendance?date=${req?.startDate ? new Date(req.startDate).toISOString().split('T')[0] : ''}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
                        >
                          <Clock className="h-3.5 w-3.5 text-amber-700" />
                          Attendance / Dispatch
                        </Link>
                      </div>
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
