import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LogOut, Menu, Sparkles, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { ROLE_LABELS } from '../constants/userRoles.js'
import { BOOT_ROUTES } from '../constants/bootFlow.js'
import { vendorNavigation, getVendorTitle } from '../config/vendorNavigation.js'
import { AppAmbientBackground } from '../components/app/AppAmbientBackground.jsx'
import { AppPageTransition } from '../components/app/AppPageTransition.jsx'
import { appSpring } from '../components/app/appMotion.js'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { AppBottomNav } from '../components/app-ui/navigation/AppBottomNav.jsx'
import { AppBadge } from '../components/app-ui/data-display/AppBadge.jsx'
import { adminInitials } from '../lib/formatAdminLastLogin.js'

function vendorHidesShellHeader(pathname) {
  if (pathname === '/vendor') return true
  if (pathname.startsWith('/vendor/jobs')) return true
  if (pathname.startsWith('/vendor/crew')) return true
  if (pathname.startsWith('/vendor/attendance')) return true
  if (pathname.startsWith('/vendor/earnings')) return true
  if (pathname.startsWith('/vendor/analytics')) return true
  if (pathname.startsWith('/vendor/support')) return true
  if (pathname.startsWith('/vendor/profile')) return true
  return false
}

export function VendorAppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const reduce = useReducedMotion()

  const { headerTagline, bottomNav, drawerNav } = vendorNavigation
  const isVendorHome = pathname === '/vendor'
  const hideShellHeader = vendorHidesShellHeader(pathname)
  const title = getVendorTitle(pathname)
  const drawerInitials = adminInitials(user)
  const profileImageUrl = user?.profileImageUrl?.trim()

  const headerBadge = useMemo(() => {
    const v = user?.contractorProfile?.verificationStatus
    if (v === 'pending') return { label: 'Verification pending', variant: 'amber' }
    if (v === 'rejected') return { label: 'Not verified', variant: 'rose' }
    if (v === 'approved') return { label: 'Verified vendor', variant: 'emerald' }
    return null
  }, [user])

  useEffect(() => {
    queueMicrotask(() => setDrawerOpen(false))
  }, [pathname])

  useEffect(() => {
    const onOpen = () => queueMicrotask(() => setDrawerOpen(true))
    window.addEventListener('lc-open-vendor-drawer', onOpen)
    return () => window.removeEventListener('lc-open-vendor-drawer', onOpen)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])

  return (
    <div className="relative min-h-dvh w-full text-slate-900" data-panel="vendor">
      <AppAmbientBackground />

      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              key="vendor-drawer-overlay"
              type="button"
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="vendor-drawer-panel"
              className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,19.5rem)] flex-col border-r border-slate-200/80 bg-white shadow-[8px_0_40px_-12px_rgba(15,23,42,0.14)]"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={reduce ? { duration: 0.2 } : appSpring}
            >
              <div className="relative border-b border-slate-200/70 bg-linear-to-b from-slate-50/90 to-white px-4 pb-4 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-bright to-brand text-xs font-black text-white shadow-md ring-2 ring-white">
                      {drawerInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">LabourChowck</p>
                      <p className="truncate text-sm font-extrabold text-slate-900">Menu</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        {ROLE_LABELS[user?.role] || 'Vendor'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {headerBadge ? (
                  <div className="mt-3">
                    <AppBadge variant={headerBadge.variant}>{headerBadge.label}</AppBadge>
                  </div>
                ) : null}
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Vendor menu">
                {drawerNav.map(({ id, to, end, label, icon: Icon }) => (
                  <NavLink
                    key={`${id}-${to}`}
                    to={to}
                    end={Boolean(end)}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-linear-to-r from-brand/10 to-white text-slate-900 shadow-[inset_0_0_0_1px_rgba(28,175,98,0.12)] before:absolute before:left-0 before:top-1/2 before:h-9 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-brand'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ${
                            isActive
                              ? 'bg-white text-brand ring-brand/25'
                              : 'bg-white text-slate-500 ring-slate-200/80 group-hover:text-brand'
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px]" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-slate-200/70 bg-linear-to-t from-slate-50/50 to-white p-3">
                <Link
                  to="/"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200/90 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  Visit website
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate(BOOT_ROUTES.SPLASH, { replace: true })
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-rose-50 py-3 text-sm font-semibold text-rose-800"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        {isVendorHome ? (
          <>
            <div
              className="pointer-events-none absolute left-1/2 top-0 z-0 h-[min(52vh,26rem)] w-full max-w-lg -translate-x-1/2 rounded-b-[2rem] bg-brand"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-0 z-0 h-[min(52vh,26rem)] w-full max-w-lg -translate-x-1/2 rounded-b-[2rem] bg-[radial-gradient(75%_55%_at_50%_0%,rgba(255,255,255,0.14),transparent_62%)]"
              aria-hidden
            />
          </>
        ) : null}

        {!hideShellHeader ? (
          <header className="sticky top-0 z-30 px-3 pt-3">
            <GlassPanel className="flex items-center gap-3 px-3 py-2.5">
              <button
                type="button"
                onClick={openDrawer}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 text-slate-700 shadow-sm hover:border-brand/30"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900">{title}</h1>
                <p className="truncate text-xs font-medium text-slate-500">{headerTagline}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand/15 to-brand-muted/60 text-brand ring-1 ring-brand/15">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
            </GlassPanel>
          </header>
        ) : null}

        <main
          className={`relative z-10 min-w-0 flex-1 overflow-x-hidden pb-28 ${
            hideShellHeader
              ? 'px-0 pt-[max(0.25rem,env(safe-area-inset-top,0px))]'
              : 'px-4 pt-4'
          }`}
        >
          <AppPageTransition />
        </main>
      </div>

      <AppBottomNav items={bottomNav} />
    </div>
  )
}
