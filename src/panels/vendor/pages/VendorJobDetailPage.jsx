import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { getVendorDummyAllocation, VENDOR_DUMMY_CREW } from '../../../lib/vendorDummyData.js'
import { vendorApi } from '../../../api/vendorApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function VendorJobDetailPage() {
  const { id } = useParams()
  const reduce = useReducedMotion()
  
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const fetchJob = async () => {
    try {
      const res = await vendorApi.getJobById(id)
      setAllocation(res?.data?.allocation)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob()
  }, [id])

  const accepted = Boolean(allocation?.vendorAcceptedAt)
  const rejected = Boolean(allocation?.vendorRejectedAt)
  const req = allocation?.requestId
  const deployedCrew = [] // To be fetched if API supports getting assigned crew, leaving empty for now as it's not in docs

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await vendorApi.acceptJob(id)
      await fetchJob()
    } catch (err) {
      alert('Failed to accept job')
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to decline this job?')) return
    setRejecting(true)
    try {
      await vendorApi.rejectJob(id)
      await fetchJob()
    } catch (err) {
      alert('Failed to reject job')
    } finally {
      setRejecting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4">
        <VendorCard className="text-sm text-slate-500">Loading…</VendorCard>
      </div>
    )
  }

  if (!allocation) {
    return (
      <div className="px-4">
        <VendorCard className="border-rose-200 text-sm text-rose-800">
          Job not found.
          <Link to="/vendor/jobs" className="mt-2 block font-bold text-brand">
            Back to jobs
          </Link>
        </VendorCard>
      </div>
    )
  }

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout>
        <Link to="/vendor/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
          <ArrowLeft className="h-4 w-4" />
          Jobs
        </Link>

        <VendorCard className="space-y-3">
          <AppBadge variant="brand" uppercase={false} className="max-w-full truncate">
            {req?.clientName || 'Corporate client'}
          </AppBadge>
          <h2 className="text-lg font-extrabold text-slate-900">{req?.reference}</h2>
          <p className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span className="min-w-0 break-words">{req?.locationText}</span>
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(req?.startDate)}
            {req?.endDate ? ` – ${formatDate(req.endDate)}` : ''}
          </p>
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users className="h-4 w-4 shrink-0 text-brand" />
            {allocation.workersAssigned ?? 0} / {allocation.workersRequired} workers
          </p>
        </VendorCard>

        {req?.lines?.length ? (
          <VendorCard>
            <p className="text-sm font-extrabold text-slate-900">Skills required</p>
            <ul className="mt-2 space-y-1.5">
              {req.lines.map((l, i) => (
                <li key={i} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 font-semibold">{l.categoryName}</span>
                  <span className="shrink-0 tabular-nums text-slate-600">{l.quantity}</span>
                </li>
              ))}
            </ul>
          </VendorCard>
        ) : null}

        <PipelineTimeline status={req?.status} compact />

        <VendorCard>
          <p className="text-sm font-extrabold text-slate-900">Deployment notes</p>
          <p className="mt-2 break-words text-sm leading-relaxed text-slate-600">
            {allocation.notes || 'No deployment notes.'}
          </p>
        </VendorCard>

        {accepted && deployedCrew.length > 0 ? (
          <VendorCard>
            <p className="text-sm font-extrabold text-slate-900">Crew on site</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {deployedCrew.map((w) => (
                <li key={w._id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate font-semibold">{w.fullName}</span>
                  <span className="shrink-0 text-slate-500">{w.skills?.[0]}</span>
                </li>
              ))}
            </ul>
          </VendorCard>
        ) : null}

        {accepted ? (
          <Link to="/vendor/crew">
            <AppPrimaryButton type="button" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Manage workforce
            </AppPrimaryButton>
          </Link>
        ) : rejected ? (
          <VendorCard className="bg-rose-50 border-rose-200">
            <p className="text-sm font-bold text-rose-800">You have declined this job.</p>
          </VendorCard>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={rejecting || accepting}
              onClick={handleReject}
              className="flex-1 rounded-xl border border-rose-200 bg-white py-3.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
            >
              {rejecting ? 'Declining...' : 'Decline'}
            </button>
            <AppPrimaryButton
              type="button"
              className="flex-[2]"
              loading={accepting}
              disabled={rejecting}
              onClick={handleAccept}
            >
              Accept allocation
            </AppPrimaryButton>
          </div>
        )}
      </VendorPageLayout>
    </motion.div>
  )
}
