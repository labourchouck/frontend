import { useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import {
  useGetVendorAttendanceQuery,
  useToggleVendorAttendanceMutation,
} from '../../../store/api/workforceApi.js'

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function VendorAttendancePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlDate = searchParams.get('date')
  const initialDate = urlDate || new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [exported, setExported] = useState(false)
  const [expandedWorkers, setExpandedWorkers] = useState({})
  const [attendanceFilter, setAttendanceFilter] = useState('ALL')

  const toggleWorker = (workerId) => {
    setExpandedWorkers(prev => prev[workerId] ? {} : { [workerId]: true })
  }

  const [togglingRecordId, setTogglingRecordId] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  const [waitingForPaymentJobId, setWaitingForPaymentJobId] = useState(null)

  const { data, isLoading, isError, refetch } = useGetVendorAttendanceQuery({
    date: selectedDate,
  }, {
    pollingInterval: waitingForPaymentJobId ? 3000 : 0
  })
  const [toggleAttendance, { isLoading: isToggling }] = useToggleVendorAttendanceMutation()

  const jobs = data?.jobs ?? []
  const availableDates = data?.availableDates ?? [selectedDate]

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isToday = selectedDate === todayStr

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    setSearchParams({ date: newDate })
  }

  const handleVendorCheckIn = async (record) => {
    if (!isToday) {
      setFeedbackMsg({ type: 'error', text: 'Dispatch / Check-in is only allowed on the current shift date.' })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    try {
      setTogglingRecordId(record._id)
      await toggleAttendance({
        recordId: record._id,
        action: 'vendorCheckIn',
      }).unwrap()
      setFeedbackMsg({
        type: 'success',
        text: `${record.labourName || 'Worker'} dispatched to client location!`,
      })
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err?.data?.message || err?.message || 'Failed to dispatch worker',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } finally {
      setTogglingRecordId(null)
    }
  }

  const handleVendorCheckOut = async (record) => {
    if (!isToday) {
      setFeedbackMsg({ type: 'error', text: 'Shift close is only allowed on the current shift date.' })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    if (!record.clientCheckOut) {
      setFeedbackMsg({
        type: 'error',
        text: 'Client must mark work complete / check out worker first before closing shift.',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    try {
      setTogglingRecordId(record._id)
      await toggleAttendance({
        recordId: record._id,
        action: 'vendorCheckOut',
      }).unwrap()

      const job = jobs.find(j => j.requestId === record.requestId)
      let isLastDay = false
      let allOthersCheckedOut = false

      if (job) {
        const jobEndDate = job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : new Date(job.startDate).toISOString().split('T')[0]
        if (selectedDate === jobEndDate) {
          isLastDay = true
          const others = job.attendanceRecords.filter(r => r._id !== record._id)
          allOthersCheckedOut = others.every(r => r.vendorCheckOut)
        }
      }

      if (isLastDay && allOthersCheckedOut) {
        setWaitingForPaymentJobId(job.requestId)
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `${record.labourName || 'Worker'} shift successfully closed!`,
        })
        setTimeout(() => setFeedbackMsg(null), 3000)
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err?.data?.message || err?.message || 'Failed to close shift',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } finally {
      setTogglingRecordId(null)
    }
  }

  const totalCrewToday = jobs.reduce((acc, j) => acc + (j.attendanceRecords?.length || 0), 0)
  const dispatchedToday = jobs.reduce((acc, j) => acc + (j.dispatchedCount || 0), 0)
  const closedToday = jobs.reduce((acc, j) => acc + (j.closedCount || 0), 0)

  const filteredJobs = useMemo(() => {
    if (!jobs) return []
    return jobs.map(job => {
      const records = job.attendanceRecords || []
      let matchingRecords = records

      if (attendanceFilter === 'PENDING') {
        matchingRecords = records.filter(r => !r.vendorCheckIn)
      } else if (attendanceFilter === 'ACTIVE') {
        matchingRecords = records.filter(r => r.vendorCheckIn && !r.vendorCheckOut)
      } else if (attendanceFilter === 'COMPLETED') {
        matchingRecords = records.filter(r => r.vendorCheckOut)
      }

      if (matchingRecords.length === 0 && attendanceFilter !== 'ALL') return null

      return { ...job, filteredRecords: matchingRecords }
    }).filter(Boolean)
  }, [jobs, attendanceFilter])

  const waitingJob = jobs.find(j => j.requestId === waitingForPaymentJobId)
  const isPaymentDone = waitingJob?.paymentStatus === 'PAID'

  const handleCollectMoney = () => {
    // In a real app we might call an API here, but user just asked to navigate to earnings
    navigate('/vendor/earnings')
  }

  const hero = (
    <section className="px-4 pb-1">
      <div className="overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-amber-900 via-slate-900 to-slate-950 p-5 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              to="/vendor"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Vendor Dispatch & Attendance
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white">Daily Crew Attendance</h1>
              <p className="mt-0.5 text-xs text-white/75">
                Tick check-in to dispatch crew to client site and check-out to close completed shifts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto rounded-xl bg-white/10 p-2.5 backdrop-blur-md ring-1 ring-white/15">
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-300">Scheduled</p>
              <p className="text-lg font-black text-white">{totalCrewToday}</p>
            </div>
            <div className="h-7 w-[1px] bg-white/20" />
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-amber-300">Dispatched</p>
              <p className="text-lg font-black text-amber-400">{dispatchedToday}</p>
            </div>
            <div className="h-7 w-[1px] bg-white/20" />
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-emerald-300">Closed</p>
              <p className="text-lg font-black text-emerald-400">{closedToday}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <VendorPageLayout hero={hero}>
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Date Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              Select Booking Date
            </label>
            <span className="text-xs text-slate-500 font-medium">
              Active Date: <strong className="text-slate-800">{formatDisplayDate(selectedDate)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {availableDates.map((dStr) => {
              const isSelected = dStr === selectedDate
              const isToday = dStr === new Date().toISOString().split('T')[0]
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => handleDateChange(dStr)}
                  className={`flex shrink-0 flex-col items-center justify-center rounded-xl px-4 py-2.5 transition-all text-xs font-bold ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-80">
                    {isToday ? 'Today' : formatDisplayDate(dStr).split(',')[0]}
                  </span>
                  <span className="text-sm font-extrabold">{formatDisplayDate(dStr).split(',')[1] || dStr}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold shadow-sm ${
                feedbackMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {feedbackMsg.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
              <span>{feedbackMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading / Error / Empty States */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Loading vendor attendance...</p>
          </div>
        ) : isError ? (
          <VendorCard className="border-rose-200 bg-rose-50/50 p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-rose-600" />
            <p className="mt-2 text-sm font-bold text-rose-900">Could not load attendance records</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
            >
              Retry
            </button>
          </VendorCard>
        ) : jobs.length === 0 ? (
          <AppEmptyState
            icon={Clock}
            title={`No Jobs Scheduled for ${formatDisplayDate(selectedDate)}`}
            subtitle="Accepted workforce requests and deployed crew members for this date will appear here."
          />
        ) : (
          /* Jobs List and Filter */
          <div className="space-y-5">
            {/* Top Level Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button onClick={() => setAttendanceFilter('ALL')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${attendanceFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                All
              </button>
              <button onClick={() => setAttendanceFilter('PENDING')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${attendanceFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Pending Dispatch
              </button>
              <button onClick={() => setAttendanceFilter('ACTIVE')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${attendanceFilter === 'ACTIVE' ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Active Shifts
              </button>
              <button onClick={() => setAttendanceFilter('COMPLETED')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${attendanceFilter === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Completed Shifts
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="py-12 text-center text-sm font-medium text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                No crew members found for this filter.
              </div>
            ) : filteredJobs.map((job) => (
              <VendorCard key={job.requestId} className="overflow-hidden p-0 border border-slate-200 shadow-sm">
                {/* Job / Corporate Client Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/80 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold font-mono text-amber-900">
                          {job.reference || 'CR-JOB'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Duration: {job.totalDays} {job.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>

                      <h2 className="mt-1 text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                        {job.client?.companyName || job.client?.name || 'Corporate Client'}
                      </h2>

                      {job.locationText && (
                        <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {job.locationText}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Link
                        to={`/vendor/jobs/${job.requestId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Job Details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Crew Member Daily Rows */}
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-800 font-bold shrink-0">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                          Booked Crew ({job.filteredRecords?.length || 0})
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Shift operations for {formatDisplayDate(selectedDate)}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-slate-50 border border-slate-200/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>Step 1: Dispatch</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span>Step 4: Shift Close</span>
                    </div>
                  </div>

                  {job.filteredRecords?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-6 px-4 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                        <Users className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">No Crew Scheduled for {formatDisplayDate(selectedDate)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Allocated crew members will be ready for check-in during active booking days.
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {job.filteredRecords.map((r) => {
                      const isWorking = togglingRecordId === r._id
                      const isWorkerExpanded = expandedWorkers[r._id]

                      const isDispatched = r.vendorCheckIn
                      const isClientPresent = r.clientCheckIn
                      const isClientCheckedOut = r.clientCheckOut
                      const isShiftClosed = r.vendorCheckOut

                      return (
                        <div
                          key={r._id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition-all"
                        >
                          <div 
                             className="flex items-start gap-3 cursor-pointer hover:opacity-80"
                             onClick={() => toggleWorker(r._id)}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 font-black text-sm text-amber-900 border border-amber-200">
                              {r.labourName?.[0] || 'L'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {r.labourName || 'Crew Member'}
                              </h4>
                              <p className="text-xs font-medium text-amber-700">
                                {r.labourServiceName || r.labourCategory || 'Specialist Labour'}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2.5">
                                {!isWorkerExpanded && (
                                   <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${isShiftClosed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : isDispatched ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                      {isShiftClosed ? 'Closed' : isDispatched ? 'Dispatched' : 'Pending'}
                                   </span>
                                )}
                                <button type="button" className="text-slate-400 p-0 hover:text-slate-600 transition-colors">
                                  {isWorkerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {isWorkerExpanded && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-hidden"
                               >
                                 <div className="flex flex-col md:flex-row justify-between gap-4 border-t border-slate-100 pt-3 mt-3">
                                   {/* Progress Status Badges */}
                                   <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {isDispatched ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <Send className="h-3 w-3 text-amber-600" />
                                    1. Dispatched ({formatTime(r.vendorCheckInAt)})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    1. Ready to Dispatch
                                  </span>
                                )}

                                {isClientPresent ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <UserCheck className="h-3 w-3 text-emerald-600" />
                                    2. Client Verified Arrival ({formatTime(r.clientCheckInAt)})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
                                    2. Awaiting Client Check-in
                                  </span>
                                )}

                                {isClientCheckedOut && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                    <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                                    3. Client Checked Out ({formatTime(r.clientCheckOutAt)})
                                  </span>
                                )}

                                {isShiftClosed && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                                    <ShieldCheck className="h-3 w-3 text-emerald-700" />
                                    4. Shift Closed & Verified
                                  </span>
                                )}
                              </div>

                               {/* Action Tick Boxes */}
                               <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                 {/* Stage 1: Vendor Check-in Checkbox */}
                                 <div className="flex flex-col gap-1">
                                   <label
                                     className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all text-[11px] font-bold select-none cursor-pointer ${
                                       isDispatched
                                         ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                         : !isToday
                                         ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                         : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300 hover:border-amber-500'
                                     }`}
                                     onClick={() => {
                                       if (!isDispatched && !isWorking && isToday) {
                                         handleVendorCheckIn(r)
                                       }
                                     }}
                                   >
                                     <div
                                       className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                         isDispatched
                                           ? 'bg-white border-white text-amber-600'
                                           : 'border-slate-400 bg-white'
                                       }`}
                                     >
                                       {isDispatched && <CheckCircle2 className="h-4 w-4" />}
                                     </div>
                                     <span>{isDispatched ? 'Dispatched (Sent)' : 'Check In (Send Labour)'}</span>
                                   </label>
                                   {isDispatched && r.vendorCheckInAt && (
                                     <span className="text-[10px] text-slate-500 text-center">
                                       Sent: {formatTime(r.vendorCheckInAt)}
                                     </span>
                                   )}
                                 </div>

                                 {/* Stage 4: Vendor Check-out / Shift Close Checkbox */}
                                 <div className="flex flex-col gap-1">
                                   <label
                                     className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all text-[11px] font-bold select-none cursor-pointer ${
                                       isShiftClosed
                                         ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                         : !isClientCheckedOut || !isToday
                                         ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                         : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-300 hover:border-emerald-500'
                                     }`}
                                     onClick={() => {
                                       if (!isShiftClosed && isClientCheckedOut && !isWorking && isToday) {
                                         handleVendorCheckOut(r)
                                       }
                                     }}
                                   >
                                     <div
                                       className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                         isShiftClosed
                                           ? 'bg-white border-white text-emerald-600'
                                           : 'border-slate-400 bg-white'
                                       }`}
                                     >
                                       {isShiftClosed && <CheckCircle2 className="h-4 w-4" />}
                                     </div>
                                     <span>{isShiftClosed ? 'Shift Closed' : 'Check Out (Close Shift)'}</span>
                                   </label>
                                   {isShiftClosed && r.vendorCheckOutAt && (
                                     <span className="text-[10px] text-slate-500 text-center">
                                       Closed: {formatTime(r.vendorCheckOutAt)}
                                     </span>
                                   )}
                                 </div>
                               </div>
                            </div>
                               </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </div>
              </VendorCard>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {waitingForPaymentJobId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center flex flex-col items-center"
            >
              {!isPaymentDone ? (
                <>
                  <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-6 relative">
                    <Loader2 className="w-10 h-10 animate-spin absolute" />
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-2">Waiting for collect money...</h2>
                  <p className="text-sm font-medium text-slate-500">
                    The corporate client is currently processing the payment. Please hold on.
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Collect Money</h2>
                  <p className="text-sm font-medium text-slate-500 mb-8">
                    The client has successfully completed the payment.
                  </p>
                  
                  <button
                    onClick={handleCollectMoney}
                    className="w-full bg-emerald-600 text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Yes
                  </button>
                  
                  <button className="mt-4 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors">
                    Report Issue
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </VendorPageLayout>
  )
}
