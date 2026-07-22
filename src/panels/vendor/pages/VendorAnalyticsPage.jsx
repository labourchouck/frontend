import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { ApprovalGate } from '../../../components/shared/ApprovalGate.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { useAuth } from '../../../hooks/useAuth.js'
import { isVendorPanelUnlocked } from '../../../lib/vendorDemo.js'
import { formatVendorInr } from '../../../lib/vendorUiHelpers.js'
import { useEffect, useState } from 'react'
import { vendorApi } from '../../../api/vendorApi.js'

export function VendorAnalyticsPage() {
  const { user } = useAuth()
  const reduce = useReducedMotion()
  const unlocked = isVendorPanelUnlocked(user)
  
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!unlocked) return
    const fetchStats = async () => {
      try {
        const res = await vendorApi.getDashboardStats()
        setStats(res?.data?.stats || {})
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [unlocked])

  if (!unlocked) {
    return (
      <div className="px-4">
        <ApprovalGate title="Analytics locked" message="Complete verification first." profileTo="/vendor/profile" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4">
        <VendorCard className="text-sm text-slate-500">Loading…</VendorCard>
      </div>
    )
  }

  const rate =
    stats.attendanceToday > 0 ? Math.round(((stats.presentToday ?? 0) / stats.attendanceToday) * 100) : 0

  const hero = (
    <section className="px-4 pb-1">
      <div className="rounded-[1.65rem] bg-linear-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/vendor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <BarChart3 className="h-8 w-8 shrink-0 text-brand-bright" />
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold">Insights</h1>
            <p className="text-xs text-white/70">Supply & deployment snapshot</p>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout hero={hero}>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Crew', value: stats.crewCount ?? 0 },
            { label: 'Open jobs', value: stats.openJobs ?? 0 },
            { label: 'Sites', value: stats.sitesActive ?? 0 },
            { label: 'Present', value: stats.presentToday ?? 0 },
            { label: 'Month earn', value: formatVendorInr(stats.earningsMonth ?? 0) },
            { label: 'Attendance', value: `${rate}%` },
          ].map((item) => (
            <VendorCard key={item.label} className="text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
              <p className="mt-1 break-words text-lg font-black text-slate-900">{item.value}</p>
            </VendorCard>
          ))}
        </div>
      </VendorPageLayout>
    </motion.div>
  )
}
