import { useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Filter,
  Info,
  MapPin,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import {
  useGetCorporateVendorAttendanceQuery,
  useToggleCorporateAttendanceMutation,
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

export function CorporateAttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlDate = searchParams.get('date')
  const initialDate = urlDate || new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [attendanceFilter, setAttendanceFilter] = useState('ALL')
  const [expandedWorkers, setExpandedWorkers] = useState({})

  const toggleWorker = (workerId) => {
    setExpandedWorkers(prev => prev[workerId] ? {} : { [workerId]: true })
  }

  const { data, isLoading, isError, refetch } = useGetCorporateVendorAttendanceQuery({
    date: selectedDate,
  })
  const [toggleAttendance, { isLoading: isToggling }] = useToggleCorporateAttendanceMutation()

  const [togglingRecordId, setTogglingRecordId] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState(null)

  const jobs = data?.jobs ?? []
  const availableDates = data?.availableDates ?? [selectedDate]

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isToday = selectedDate === todayStr

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    setSearchParams({ date: newDate })
  }

  const handleCheckIn = async (record) => {
    if (!isToday) {
      setFeedbackMsg({ type: 'error', text: 'Check-in is only allowed on the current shift date.' })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    if (!record.vendorCheckIn) {
      setFeedbackMsg({
        type: 'error',
        text: 'Waiting for vendor to dispatch / check-in this worker first.',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    try {
      setTogglingRecordId(record._id)
      await toggleAttendance({
        recordId: record._id,
        action: 'clientCheckIn',
      }).unwrap()
      setFeedbackMsg({
        type: 'success',
        text: `${record.labourName || 'Worker'} marked Present on-site!`,
      })
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err?.data?.message || err?.message || 'Failed to update check-in',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } finally {
      setTogglingRecordId(null)
    }
  }

  const handleCheckOut = async (record) => {
    if (!isToday) {
      setFeedbackMsg({ type: 'error', text: 'Check-out is only allowed on the current shift date.' })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    if (!record.clientCheckIn) {
      setFeedbackMsg({
        type: 'error',
        text: 'Worker must be checked in on site first before check-out.',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
      return
    }
    try {
      setTogglingRecordId(record._id)
      await toggleAttendance({
        recordId: record._id,
        action: 'clientCheckOut',
      }).unwrap()
      setFeedbackMsg({
        type: 'success',
        text: `${record.labourName || 'Worker'} marked Work Completed (Checked Out)!`,
      })

      const job = jobs.find(j => j.attendanceRecords?.some(r => r._id === record._id))
      if (job) {
        const isLastDay = job.bookedDates?.[job.bookedDates.length - 1] === selectedDate
        const allOthersCheckedOut = job.attendanceRecords
          .filter(r => r._id !== record._id)
          .every(r => r.clientCheckOut)

        if (isLastDay && allOthersCheckedOut) {
          setTimeout(() => {
            navigate(`/corporate/requests/${job.requestId}?payment=true`)
          }, 1500)
        }
      }

      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err?.data?.message || err?.message || 'Failed to update check-out',
      })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } finally {
      setTogglingRecordId(null)
    }
  }

  // Summary counts across all jobs for this date
  const totalCrewToday = jobs.reduce((acc, j) => acc + (j.attendanceRecords?.length || 0), 0)
  const presentToday = jobs.reduce((acc, j) => acc + (j.presentCount || 0), 0)
  const completedToday = jobs.reduce((acc, j) => acc + (j.completedCount || 0), 0)

  const filteredJobs = useMemo(() => {
    if (!jobs) return []
    return jobs.map(job => {
      const records = job.attendanceRecords || []
      let matchingRecords = records

      if (attendanceFilter === 'PENDING') {
        matchingRecords = records.filter(r => r.vendorCheckIn && !r.clientCheckIn)
      } else if (attendanceFilter === 'ACTIVE') {
        matchingRecords = records.filter(r => r.clientCheckIn && !r.clientCheckOut)
      } else if (attendanceFilter === 'COMPLETED') {
        matchingRecords = records.filter(r => r.clientCheckOut)
      }

      if (matchingRecords.length === 0 && attendanceFilter !== 'ALL') return null

      return { ...job, filteredRecords: matchingRecords }
    }).filter(Boolean)
  }, [jobs, attendanceFilter])

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand/90 p-5 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand/20 text-brand ring-1 ring-white/10">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Corporate Operations
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Daily Workforce Attendance</h1>
            <p className="mt-1 text-xs text-slate-300">
              Verify labour check-in upon site arrival and check-out after work completion.
            </p>
          </div>

          {/* Real-time Summary Pill */}
          <div className="flex items-center gap-3 self-start sm:self-auto rounded-xl bg-white/10 p-2.5 backdrop-blur-md ring-1 ring-white/15">
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-slate-300">Booked</p>
              <p className="text-lg font-black text-white">{totalCrewToday}</p>
            </div>
            <div className="h-7 w-[1px] bg-white/20" />
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-emerald-300">On Site</p>
              <p className="text-lg font-black text-emerald-400">{presentToday}</p>
            </div>
            <div className="h-7 w-[1px] bg-white/20" />
            <div className="text-center px-2">
              <p className="text-[10px] font-bold uppercase text-blue-300">Completed</p>
              <p className="text-lg font-black text-blue-400">{completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-brand" />
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
                    ? 'bg-brand text-white shadow-md shadow-brand/25 ring-2 ring-brand'
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

      {/* Dynamic Feedback Alert */}
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

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading daily attendance records...</p>
        </div>
      ) : isError ? (
        <AppSurface className="border-rose-200 bg-rose-50/50 p-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600" />
          <p className="mt-2 text-sm font-bold text-rose-900">Could not load attendance data</p>
          <p className="mt-1 text-xs text-rose-700">Please try selecting another date or refresh.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
          >
            Retry
          </button>
        </AppSurface>
      ) : jobs.length === 0 ? (
        <AppEmptyState
          icon={Clock}
          title={`No Workforce Bookings for ${formatDisplayDate(selectedDate)}`}
          subtitle="Accepted vendor jobs and scheduled crew members for this date will appear here."
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
              Pending Check-in
            </button>
            <button onClick={() => setAttendanceFilter('ACTIVE')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${attendanceFilter === 'ACTIVE' ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              On Site
            </button>
            <button onClick={() => setAttendanceFilter('COMPLETED')} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${attendanceFilter === 'COMPLETED' ? 'bg-indigo-500 text-white shadow-sm ring-2 ring-indigo-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              Completed Work
            </button>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              No crew members found for this filter.
            </div>
          ) : filteredJobs.map((job) => (
            <AppSurface key={job.requestId} className="overflow-hidden p-0 border border-slate-200/90 shadow-sm">
              {/* Job / Vendor Header */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/70 border-b border-slate-200/80 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-extrabold font-mono text-brand">
                        {job.reference || 'CR-JOB'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Duration: {job.totalDays} {job.totalDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <h2 className="mt-1 text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                      {job.vendor?.businessName || job.vendor?.name || 'Assigned Vendor Partner'}
                    </h2>

                    {job.locationText && (
                      <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {job.locationText}
                      </p>
                    )}
                  </div>

                  {/* Actions & Summary */}
                  <div className="flex items-center gap-2">
                    {job.attendanceRecords?.length > 0 && job.attendanceRecords.every(r => r.vendorCheckOut) && (
                      <Link 
                        to={`/corporate/requests/${job.requestId}?payment=true`}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        Make Payment
                      </Link>
                    )}
                    <Link
                      to={`/corporate/requests/${job.requestId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Request Details
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Crew Attendance Table / Cards */}
              <div className="p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold shrink-0">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                        Booked Labour Crew ({job.filteredRecords?.length || 0})
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Daily verification for {formatDisplayDate(selectedDate)}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-slate-50 border border-slate-200/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    <span>Step 2: Check-in</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span>Step 3: Check-out</span>
                  </div>
                </div>

                {job.filteredRecords?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-6 px-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                      <Users className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No Crew Scheduled for {formatDisplayDate(selectedDate)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Crew members allocated for this request will appear here on active shift dates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {job.filteredRecords.map((r) => {
                      const isWorking = togglingRecordId === r._id
                      const isWorkerExpanded = expandedWorkers[r._id]

                      // Stage calculations
                      const isDispatched = r.vendorCheckIn
                      const isClientPresent = r.clientCheckIn
                      const isClientCheckedOut = r.clientCheckOut
                      const isShiftClosed = r.vendorCheckOut

                      return (
                        <div
                          key={r._id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-brand/40 transition-all"
                        >
                          <div 
                             className="flex items-start gap-3 cursor-pointer hover:opacity-80"
                             onClick={() => toggleWorker(r._id)}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-black text-sm text-slate-700">
                              {r.labourName?.[0] || 'L'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-sm text-slate-900">
                                {r.labourName || 'Booked Specialist'}
                              </h4>
                              <p className="text-xs font-medium text-brand">
                                {r.labourServiceName || r.labourCategory || 'Specialist Labour'}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2.5">
                                {!isWorkerExpanded && (
                                   <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${isShiftClosed ? 'bg-slate-100 text-slate-800 border-slate-300' : isClientCheckedOut ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : isClientPresent ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : isDispatched ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                      {isShiftClosed ? 'Closed' : isClientCheckedOut ? 'Completed' : isClientPresent ? 'On Site' : isDispatched ? 'Dispatched' : 'Pending'}
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
                                {!isDispatched ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <Clock className="h-3 w-3" />
                                    1. Awaiting Vendor Dispatch
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                    <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                    1. Dispatched ({formatTime(r.vendorCheckInAt)})
                                  </span>
                                )}

                                {isClientPresent && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <UserCheck className="h-3 w-3 text-emerald-600" />
                                    2. On Site ({formatTime(r.clientCheckInAt)})
                                  </span>
                                )}

                                {isClientCheckedOut && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                    <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                                    3. Work Complete ({formatTime(r.clientCheckOutAt)})
                                  </span>
                                )}

                                {isShiftClosed && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                                    <ShieldCheck className="h-3 w-3 text-slate-700" />
                                    4. Shift Closed
                                  </span>
                                )}
                              </div>

                              {/* Action Tick Boxes */}
                              <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                {/* Stage 2: Client Check-In Checkbox */}
                                <div className="flex flex-col gap-1">
                                  <label
                                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all text-[11px] font-bold select-none cursor-pointer ${
                                      isClientPresent
                                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                        : !isDispatched || !isToday
                                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                        : 'bg-white hover:bg-emerald-50/70 text-slate-800 border-slate-300 hover:border-emerald-500'
                                    }`}
                                    onClick={() => {
                                      if (!isClientPresent && isDispatched && !isWorking && isToday) {
                                        handleCheckIn(r)
                                      }
                                    }}
                                  >
                                    <div
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                        isClientPresent
                                          ? 'bg-white border-white text-emerald-600'
                                          : 'border-slate-400 bg-white'
                                      }`}
                                    >
                                      {isClientPresent && <CheckCircle2 className="h-4 w-4" />}
                                    </div>
                                    <span>{isClientPresent ? 'Checked In (Present)' : 'Check In (On Site)'}</span>
                                  </label>
                                  {isClientPresent && r.clientCheckInAt && (
                                    <span className="text-[10px] text-slate-500 text-center">
                                      Arrived: {formatTime(r.clientCheckInAt)}
                                    </span>
                                  )}
                                </div>

                                {/* Stage 3: Client Check-Out Checkbox */}
                                <div className="flex flex-col gap-1">
                                  <label
                                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all text-[11px] font-bold select-none cursor-pointer ${
                                      isClientCheckedOut
                                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                        : !isClientPresent || !isToday
                                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                        : 'bg-white hover:bg-indigo-50/70 text-slate-800 border-slate-300 hover:border-indigo-500'
                                    }`}
                                    onClick={() => {
                                      if (!isClientCheckedOut && isClientPresent && !isWorking && isToday) {
                                        handleCheckOut(r)
                                      }
                                    }}
                                  >
                                    <div
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                        isClientCheckedOut
                                          ? 'bg-white border-white text-indigo-600'
                                          : 'border-slate-400 bg-white'
                                      }`}
                                    >
                                      {isClientCheckedOut && <CheckCircle2 className="h-4 w-4" />}
                                    </div>
                                    <span>{isClientCheckedOut ? 'Checked Out (Done)' : 'Check Out (Work Done)'}</span>
                                  </label>
                                  {isClientCheckedOut && r.clientCheckOutAt && (
                                    <span className="text-[10px] text-slate-500 text-center">
                                      Completed: {formatTime(r.clientCheckOutAt)}
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
            </AppSurface>
          ))}
        </div>
      )}
    </div>
  )
}
