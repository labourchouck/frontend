import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Clock, Download } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppButton } from '../../../components/app-ui/buttons/AppButton.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { VENDOR_DEMO_MODE } from '../../../lib/vendorDemo.js'
import {
  groupAttendanceBySite,
  VENDOR_DUMMY_ATTENDANCE,
  VENDOR_DUMMY_STATS,
} from '../../../lib/vendorDummyData.js'
import { useGetAttendanceQuery } from '../../../store/api/workforceApi.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function VendorAttendancePage() {
  const reduce = useReducedMotion()
  const [exported, setExported] = useState(false)
  const { data, isLoading, isError } = useGetAttendanceQuery(undefined, { skip: VENDOR_DEMO_MODE })
  const records = VENDOR_DEMO_MODE ? VENDOR_DUMMY_ATTENDANCE : (data?.records ?? [])
  const grouped = useMemo(() => groupAttendanceBySite(records), [records])
  const stats = VENDOR_DEMO_MODE ? VENDOR_DUMMY_STATS : {}

  const hero = (
    <section className="px-4 pb-1">
      <div className="overflow-hidden rounded-[1.65rem] bg-linear-to-br from-amber-800 via-slate-900 to-slate-950 p-4 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <Link to="/vendor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12">
            <Clock className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Operations</p>
            <h1 className="text-xl font-extrabold">Attendance</h1>
            <p className="mt-1 text-xs text-white/75">
              {stats.presentToday ?? 0} present · {stats.absentToday ?? 0} absent today
            </p>
          </div>
          <AppButton
            type="button"
            variant="secondary"
            className="!w-auto shrink-0 border-white/30 bg-white/10 px-2.5 py-2 text-white"
            onClick={() => setExported(true)}
          >
            <Download className="h-4 w-4" />
          </AppButton>
        </div>
      </div>
    </section>
  )

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout hero={hero}>
        {exported ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900">
            Report export started. You will receive a download link shortly.
          </p>
        ) : null}

        {isLoading && !VENDOR_DEMO_MODE ? <VendorCard className="text-sm text-slate-500">Loading…</VendorCard> : null}
        {isError && !VENDOR_DEMO_MODE ? <VendorCard className="text-sm text-rose-800">Could not load attendance.</VendorCard> : null}

        {records.length === 0 ? (
          <AppEmptyState icon={Clock} title="No logs" subtitle="Crew check-ins appear here." />
        ) : (
          grouped.map(({ siteName, rows }) => (
            <section key={siteName}>
              <h3 className="mb-2 line-clamp-2 text-xs font-bold uppercase tracking-wider text-slate-500">{siteName}</h3>
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li key={r._id}>
                    <VendorCard className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{r.labourId?.fullName}</p>
                        <p className="text-xs text-slate-500">{formatDate(r.shiftDate)}</p>
                        {r.checkIn ? (
                          <p className="mt-1 text-[10px] text-slate-500">
                            {r.checkIn} – {r.checkOut || '—'}
                          </p>
                        ) : null}
                      </div>
                      <AppBadge
                        variant={r.status === 'present' ? 'emerald' : r.status === 'half_day' ? 'amber' : 'rose'}
                        uppercase={false}
                        className="shrink-0 text-[10px]"
                      >
                        {r.status.replace('_', ' ')}
                      </AppBadge>
                    </VendorCard>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </VendorPageLayout>
    </motion.div>
  )
}
