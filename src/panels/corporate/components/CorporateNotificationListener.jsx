import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, CheckCircle2, ChevronRight, Sparkles, UserCheck, X, AlertCircle } from 'lucide-react'
import { useSocket } from '../../../context/SocketContext.jsx'

export function CorporateNotificationListener() {
  const socket = useSocket()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    if (!socket) return

    const handleJobAccepted = (data) => {
      console.log('[Corporate Notification] Vendor Accepted Request:', data)
      const id = Date.now().toString()
      const newToast = {
        id,
        type: 'JOB_ACCEPTED',
        title: 'Vendor Accepted Request!',
        vendorName: data.vendorName || data.businessName || 'Vendor',
        reference: data.reference || 'Workforce Request',
        requestId: data.requestId,
        startDate: data.startDate,
        crewCount: data.crewCount || 1,
        message: data.message || `Vendor ${data.vendorName || 'Partner'} has accepted your workforce request.`,
        createdAt: Date.now(),
      }

      setToasts((prev) => [newToast, ...prev.slice(0, 3)])
    }

    const handleJobRejected = (data) => {
      console.log('[Corporate Notification] Vendor Rejected Request:', data)
      const id = Date.now().toString()
      const newToast = {
        id,
        type: 'JOB_REJECTED',
        title: 'Vendor Declined Request',
        vendorName: data.vendorName || data.businessName || 'Vendor',
        reference: data.reference || 'Workforce Request',
        requestId: data.requestId,
        message: data.message || `Vendor ${data.vendorName || 'Partner'} has declined your request. Please search and assign another vendor.`,
        createdAt: Date.now(),
      }

      setToasts((prev) => [newToast, ...prev.slice(0, 3)])
    }

    const handleAttendanceUpdate = (data) => {
      console.log('[Corporate Notification] Attendance Updated:', data)
      let actionLabel = 'updated attendance'
      if (data.action === 'vendorCheckIn') actionLabel = 'dispatched / checked in by vendor'
      else if (data.action === 'clientCheckIn') actionLabel = 'checked in on site'
      else if (data.action === 'clientCheckOut') actionLabel = 'checked out (work complete)'
      else if (data.action === 'vendorCheckOut') actionLabel = 'shift closed by vendor'

      const id = Date.now().toString()
      const newToast = {
        id,
        type: 'ATTENDANCE_UPDATE',
        title: 'Attendance Update',
        labourName: data.labourName || 'Crew Member',
        message: `${data.labourName || 'Labour'} was ${actionLabel}.`,
        requestId: data.requestId,
        createdAt: Date.now(),
      }

      setToasts((prev) => [newToast, ...prev.slice(0, 3)])
    }

    socket.on('B2B_REQUEST_ACCEPTED', handleJobAccepted)
    socket.on('B2B_REQUEST_REJECTED', handleJobRejected)
    socket.on('ATTENDANCE_UPDATED', handleAttendanceUpdate)

    return () => {
      socket.off('B2B_REQUEST_ACCEPTED', handleJobAccepted)
      socket.off('B2B_REQUEST_REJECTED', handleJobRejected)
      socket.off('ATTENDANCE_UPDATED', handleAttendanceUpdate)
    }
  }, [socket])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex max-w-sm w-full flex-col gap-2 pointer-events-none px-2 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'JOB_REJECTED'
          const borderColor = isError ? 'border-red-500/30' : 'border-emerald-500/30'
          const ambientColor = isError ? 'bg-red-400/15' : 'bg-emerald-400/15'
          const iconBg = isError ? 'from-red-500 to-orange-600 shadow-red-500/20' : 'from-emerald-500 to-teal-600 shadow-emerald-500/20'
          const titleColor = isError ? 'text-red-700' : 'text-emerald-700'
          const pingColor = isError ? 'bg-red-500' : 'bg-emerald-500'
          const btnColor = isError ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${borderColor} bg-white/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/5`}
            >
              {/* Ambient accent background */}
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${ambientColor} blur-2xl pointer-events-none`} />

              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} text-white shadow-md`}>
                  {toast.type === 'JOB_ACCEPTED' ? (
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  ) : toast.type === 'JOB_REJECTED' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <UserCheck className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${titleColor}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pingColor} animate-ping`} />
                      {toast.title}
                    </span>
                    <button
                      type="button"
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">
                  {toast.message}
                </p>

                {toast.reference && (
                  <p className="mt-0.5 text-xs text-slate-500 font-mono">
                    Ref: {toast.reference}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {toast.requestId && (
                    <button
                      type="button"
                      onClick={() => {
                        removeToast(toast.id)
                        navigate(`/corporate/requests/${toast.requestId}`)
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg ${btnColor} px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors`}
                    >
                      View Request
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      removeToast(toast.id)
                      navigate('/corporate/attendance')
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    Attendance
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
