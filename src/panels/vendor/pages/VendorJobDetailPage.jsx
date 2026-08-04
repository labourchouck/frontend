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
import { SharedAttendanceDrawer } from '../../../components/shared/SharedAttendanceDrawer.jsx'

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
  const [selectedAttendanceReqId, setSelectedAttendanceReqId] = useState(null)

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
  const deployedCrew = allocation?.assignments || []

  const days = (() => {
    if (!req?.startDate) return 1
    const start = new Date(req.startDate)
    const end = req.endDate ? new Date(req.endDate) : start
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays)
  })()

  const hasCrew = req?.preferredCrewIds?.length > 0
  const totalVendorPricePerDay = hasCrew
    ? req.preferredCrewIds.reduce((sum, w) => sum + (w.services?.[0]?.price || w.price || 0), 0)
    : 0
  const totalVendorEarning = totalVendorPricePerDay * days

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
            <span className="ml-1.5 font-bold text-slate-700">
              ({days} {days === 1 ? 'day' : 'days'})
            </span>
          </p>
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users className="h-4 w-4 shrink-0 text-brand" />
            {allocation.workersAssigned ?? 0} / {allocation.workersRequired} workers
          </p>
        </VendorCard>

        {hasCrew && (
          <VendorCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold text-slate-900">Requested Crew & Earnings</p>
              <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                {days} {days === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="space-y-2.5">
              {req.preferredCrewIds.map((worker) => {
                const serviceName = worker.services?.[0]?.name || worker.serviceName || worker.category || 'Specialist Labour'
                const dailyPrice = worker.services?.[0]?.price || worker.price || 0
                const workerTotal = dailyPrice * days
                return (
                  <div key={worker._id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{worker.fullName}</p>
                      <p className="text-xs text-slate-500">{serviceName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">
                        ₹{workerTotal.toLocaleString('en-IN')}
                      </span>
                      {days > 1 ? (
                        <span className="block text-[11px] text-slate-400">
                          ₹{dailyPrice.toLocaleString('en-IN')}/day × {days}d
                        </span>
                      ) : (
                        <span className="block text-[11px] text-slate-400">/day</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-slate-800 block">Total Vendor Earning:</span>
                <span className="text-xs text-slate-500">
                  ₹{totalVendorPricePerDay.toLocaleString('en-IN')}/day for {days} {days === 1 ? 'day' : 'days'}
                </span>
              </div>
              <span className="text-lg font-black text-emerald-600">
                ₹{totalVendorEarning.toLocaleString('en-IN')}
              </span>
            </div>
          </VendorCard>
        )}

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



        {accepted && deployedCrew.length > 0 ? (
          <VendorCard>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold text-slate-900">Crew on site</p>
              <button 
                onClick={() => setSelectedAttendanceReqId(req._id)}
                className="text-[10px] font-bold text-brand hover:text-white hover:bg-brand bg-brand/10 px-2.5 py-1 rounded-full transition-all duration-300"
              >
                View Attendance
              </button>
            </div>
            <div className="space-y-3">
              {deployedCrew.map((w) => {
                const worker = w.labourId || {}
                const serviceName = worker.services?.[0]?.name || worker.category || 'Worker'
                const dailyPrice = worker.services?.[0]?.price || 0
                return (
                  <div key={w._id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                    <div>
                      <span className="block font-bold text-slate-800">{worker.fullName || 'Pending'}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{serviceName}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{w.status?.replace('_', ' ')}</span>
                      {dailyPrice > 0 && <span className="block text-xs text-brand font-semibold mt-0.5">₹{dailyPrice.toLocaleString('en-IN')}/day</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </VendorCard>
        ) : null}

        {accepted ? (
          <div className="flex flex-col gap-2.5">
            <Link to={`/vendor/attendance?date=${req?.startDate ? new Date(req.startDate).toISOString().split('T')[0] : ''}`}>
              <AppPrimaryButton type="button" className="w-full bg-amber-600 hover:bg-amber-700">
                Daily Attendance & Dispatch
              </AppPrimaryButton>
            </Link>
            <Link to="/vendor/crew">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                Manage workforce
              </button>
            </Link>
          </div>
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

      <SharedAttendanceDrawer
        requestId={selectedAttendanceReqId}
        onClose={() => setSelectedAttendanceReqId(null)}
      />
    </motion.div>
  )
}
