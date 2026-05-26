import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { PipelineTimeline } from '../../../components/shared/PipelineTimeline.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { VENDOR_DEMO_MODE } from '../../../lib/vendorDemo.js'
import { getVendorDummyAllocation, VENDOR_DUMMY_CREW } from '../../../lib/vendorDummyData.js'
import { useAcceptVendorJobMutation, useGetVendorJobsQuery } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function VendorJobDetailPage() {
  const { id } = useParams()
  const reduce = useReducedMotion()
  const [demoAccepted, setDemoAccepted] = useState(false)
  const { data, isLoading } = useGetVendorJobsQuery(undefined, { skip: VENDOR_DEMO_MODE })
  const [acceptJob, { isLoading: accepting }] = useAcceptVendorJobMutation()

  const allocation = VENDOR_DEMO_MODE ? getVendorDummyAllocation(id) : (data?.allocations ?? []).find((a) => String(a._id) === String(id))
  const accepted = VENDOR_DEMO_MODE ? demoAccepted || Boolean(allocation?.vendorAcceptedAt) : Boolean(allocation?.vendorAcceptedAt)
  const req = allocation?.requestId
  const deployedCrew = VENDOR_DEMO_MODE ? VENDOR_DUMMY_CREW.filter((c) => c.availability === 'on_site').slice(0, 4) : []

  if (isLoading && !VENDOR_DEMO_MODE) {
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
            <AppPrimaryButton type="button" className="w-full">
              Manage workforce
            </AppPrimaryButton>
          </Link>
        ) : (
          <AppPrimaryButton
            type="button"
            className="w-full"
            loading={accepting}
            onClick={() => {
              if (VENDOR_DEMO_MODE) setDemoAccepted(true)
              else acceptJob(id)
            }}
          >
            Accept allocation
          </AppPrimaryButton>
        )}
      </VendorPageLayout>
    </motion.div>
  )
}
