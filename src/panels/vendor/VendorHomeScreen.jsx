import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  Clock,
  IndianRupee,
  LifeBuoy,
  MapPin,
  Menu,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { ApprovalGate } from '../../components/shared/ApprovalGate.jsx'
import { AppSectionHeader } from '../../components/app-ui/layout/AppSectionHeader.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { VendorPageLayout } from '../../components/vendor/VendorPageLayout.jsx'
import { isVendorPanelUnlocked, VENDOR_DEMO_MODE } from '../../lib/vendorDemo.js'
import {
  filterVendorJobs,
  VENDOR_DUMMY_ALLOCATIONS,
  VENDOR_DUMMY_STATS,
} from '../../lib/vendorDummyData.js'
import { formatVendorInr, openVendorDrawer, vendorInitials, vendorTimeGreeting } from '../../lib/vendorUiHelpers.js'

const QUICK_ACTIONS = [
  { to: '/vendor/jobs', label: 'Supply jobs', icon: ClipboardList, bg: 'from-sky-500/15 to-sky-50', tone: 'text-sky-700' },
  { to: '/vendor/crew', label: 'Workforce', icon: Users, bg: 'from-violet-500/15 to-violet-50', tone: 'text-violet-700' },
  { to: '/vendor/attendance', label: 'Attendance', icon: Clock, bg: 'from-amber-500/15 to-amber-50', tone: 'text-amber-800' },
  { to: '/vendor/earnings', label: 'Payouts', icon: IndianRupee, bg: 'from-emerald-500/15 to-emerald-50', tone: 'text-emerald-700' },
  { to: '/vendor/analytics', label: 'Insights', icon: BarChart3, bg: 'from-orange-500/15 to-orange-50', tone: 'text-orange-800' },
  { to: '/vendor/support', label: 'Support', icon: LifeBuoy, bg: 'from-rose-500/15 to-rose-50', tone: 'text-rose-700' },
]

export function VendorHomeScreen({ user }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const unlocked = isVendorPanelUnlocked(user)
  const verified = user?.contractorProfile?.verificationStatus === 'approved' || VENDOR_DEMO_MODE
  const stats = VENDOR_DEMO_MODE ? VENDOR_DUMMY_STATS : {}
  const pendingJobs = filterVendorJobs(VENDOR_DUMMY_ALLOCATIONS, 'pending').slice(0, 2)

  const firstName = user?.fullName?.split(/\s/)?.[0]
  const businessName = user?.contractorProfile?.businessName || user?.fullName || 'Vendor'
  const initials = vendorInitials(user?.fullName || businessName)
  const profileImageUrl = user?.profileImageUrl?.trim()

  if (!unlocked) {
    return (
      <div className="px-4">
        <ApprovalGate
          title="Vendor verification required"
          message="Upload business documents on your profile. Operations will verify your account before supply jobs unlock."
          profileTo="/vendor/profile"
        />
      </div>
    )
  }

  const hero = (
    <section className="relative px-4 pb-2">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.55)]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=60')] bg-cover bg-center opacity-25"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-950/85 via-slate-900/75 to-brand/30" aria-hidden />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={openVendorDrawer}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm hover:bg-white/20"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              to="/vendor/profile"
              className="shrink-0 rounded-full p-0.5 ring-2 ring-white/35 hover:ring-white/60"
              aria-label="Profile"
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-black">
                  {initials}
                </span>
              )}
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-white/75">
                {vendorTimeGreeting()}
                {firstName ? `, ${firstName}` : ''} 👋
              </p>
              <h1 className="mt-0.5 line-clamp-2 text-lg font-extrabold leading-tight sm:text-xl">{businessName}</h1>
              <p className="mt-0.5 text-xs text-white/70">Contractor · workforce supply</p>
              {verified ? (
                <span className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-100">
                  <ShieldCheck className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  <span className="truncate">Verified vendor</span>
                </span>
              ) : (
                <Link
                  to="/vendor/profile"
                  className="mt-2 inline-flex max-w-full items-center gap-0.5 rounded-full border border-amber-300/50 bg-amber-500/25 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-50"
                >
                  <span className="truncate">Verify business</span>
                  <ChevronRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
                </Link>
              )}
            </div>

            <div className="flex w-full shrink-0 flex-row gap-3 sm:w-auto sm:min-w-[8.5rem] sm:flex-col">
              <div className="flex min-w-0 flex-1 flex-col justify-between rounded-2xl border border-emerald-400/35 bg-linear-to-br from-emerald-500/25 to-white/10 p-3 backdrop-blur-md sm:flex-none">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100/90">This month</p>
                  <p className="mt-0.5 break-words font-mono text-base font-black tabular-nums text-white sm:text-lg">
                    {formatVendorInr(stats.earningsMonth ?? 0)}
                  </p>
                  <p className="mt-0.5 text-[9px] text-white/55">{stats.crewCount ?? 0} crew linked</p>
                </div>
                <Link
                  to="/vendor/earnings"
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-linear-to-r from-brand-bright to-brand py-2 text-[10px] font-black text-white shadow-md"
                >
                  <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Payouts
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/vendor/jobs')}
            className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-left text-sm backdrop-blur-sm hover:bg-white/15"
          >
            <MapPin className="h-4 w-4 shrink-0 text-brand-bright" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-medium text-white/90">
              {stats.sitesActive ?? 0} active site deployments · tap to manage
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
          </button>
        </div>
      </motion.div>
    </section>
  )

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout hero={hero} sheet>
        <section>
          <AppSectionHeader title="Quick actions" />
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {QUICK_ACTIONS.map(({ to, label, icon: Icon, bg, tone }) => (
              <Link
                key={to}
                to={to}
                className={`flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-linear-to-b ${bg} px-1.5 py-3 text-center shadow-sm ring-1 ring-slate-100/90 transition active:scale-[0.98] hover:shadow-md`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="line-clamp-2 text-[10px] font-bold leading-tight text-slate-800">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <GlassPanel className="grid grid-cols-3 gap-3 border-slate-200/90 p-4">
          <div className="min-w-0 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Crew</p>
            <p className="mt-1 text-xl font-black tabular-nums text-slate-900">{stats.crewCount ?? 0}</p>
          </div>
          <div className="min-w-0 border-x border-slate-100 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Present</p>
            <p className="mt-1 text-xl font-black tabular-nums text-brand">{stats.presentToday ?? 0}</p>
          </div>
          <div className="min-w-0 text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400">Open jobs</p>
            <p className="mt-1 text-xl font-black tabular-nums text-amber-700">{stats.openJobs ?? 0}</p>
          </div>
        </GlassPanel>

        {pendingJobs.length > 0 ? (
          <section>
            <AppSectionHeader title="Accept allocations" actionLabel="View all" actionTo="/vendor/jobs" />
            <ul className="mt-2 space-y-2">
              {pendingJobs.map((a) => (
                <li key={a._id}>
                  <Link to={`/vendor/jobs/${a._id}`} className="block">
                    <GlassPanel className="flex items-center justify-between gap-3 p-4 transition hover:border-brand/30">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{a.requestId?.reference}</p>
                        <p className="truncate text-xs text-slate-500">{a.requestId?.clientName}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                        Accept
                      </span>
                    </GlassPanel>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <AppSectionHeader title="Supply workflow" />
          <GlassPanel className="mt-2 space-y-3 border-slate-200/90 p-4">
            {[
              'Admin assigns bulk workforce request (FCFS)',
              'You accept & deploy linked crew',
              'Daily attendance tracked on site',
              'Settlement after billing milestone',
            ].map((step, i) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-black text-brand">
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-snug text-slate-700">{step}</p>
              </div>
            ))}
          </GlassPanel>
        </section>
      </VendorPageLayout>
    </motion.div>
  )
}
