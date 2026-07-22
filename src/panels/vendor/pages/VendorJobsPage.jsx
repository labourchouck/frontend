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
      alert('Failed to accept job')
    } finally {
      setAccepting(false)
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
            return (
              <li key={a._id}>
                <VendorCard className="space-y-3">
                  <Link to={`/vendor/jobs/${a._id}`} className="block min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{req?.reference}</p>
                        <p className="truncate text-xs text-slate-500">{req?.clientName}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{req?.locationText}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {formatDate(req?.startDate)}
                          {req?.endDate ? ` – ${formatDate(req.endDate)}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                    </div>
                  </Link>
                  <PipelineTimeline status={req?.status} title="Status" compact />
                  {pending ? (
                    <AppPrimaryButton type="button" className="w-full" loading={accepting} onClick={() => void handleAccept(a._id)}>
                      Accept allocation
                    </AppPrimaryButton>
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
