import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Plus, ShieldCheck, Users } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { AppSectionHeader } from '../../../components/app-ui/layout/AppSectionHeader.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { VENDOR_DUMMY_CREW } from '../../../lib/vendorDummyData.js'
import { useEffect, useState } from 'react'
import { vendorApi } from '../../../api/vendorApi.js'

export function VendorCrewPage() {
  const reduce = useReducedMotion()
  const [crew, setCrew] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchCrew = async () => {
    try {
      const res = await vendorApi.getCrew()
      setCrew(res?.data?.crew || [])
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrew()
  }, [])

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this worker from your crew?')) return
    try {
      await vendorApi.removeWorker(id)
      setCrew(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      alert('Failed to remove worker')
    }
  }

  const hero = (
    <section className="px-4 pb-1">
      <div className="overflow-hidden rounded-[1.65rem] bg-linear-to-br from-violet-900 via-slate-900 to-slate-950 p-4 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <Link
            to="/vendor"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12">
            <Users className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Workforce</p>
            <h1 className="text-xl font-extrabold">Your crew</h1>
            <p className="mt-1 text-xs text-white/75">{crew.length} workers linked</p>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <VendorPageLayout hero={hero}>
        <Link to="/vendor/crew/new">
          <AppPrimaryButton type="button" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Link worker by phone
          </AppPrimaryButton>
        </Link>

        <VendorCard className="flex gap-3 border-brand/15 bg-brand/5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="min-w-0 text-xs leading-relaxed text-slate-600">
            Workers register on the Labour app first, then you link them here to supply on jobs.
          </p>
        </VendorCard>

        {loading ? <VendorCard className="text-sm text-slate-500">Loading…</VendorCard> : null}
        {error ? (
          <VendorCard className="text-sm text-rose-800">Could not load crew.</VendorCard>
        ) : null}

        {crew.length === 0 ? (
          <AppEmptyState icon={Users} title="No crew yet" subtitle="Link your first worker to start supplying labour." />
        ) : (
          <>
            <AppSectionHeader title="Linked workers" />
            <ul className="space-y-2">
              {crew.map((w) => (
                <li key={w._id}>
                  <VendorCard className="space-y-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{w.fullName}</p>
                      <p className="text-xs text-slate-500">{w.phone}</p>
                      {w.skills?.length ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{w.skills.join(' · ')}</p>
                      ) : null}
                      {w.activeSite ? (
                        <p className="mt-1 line-clamp-2 text-[10px] font-semibold text-slate-500">{w.activeSite}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-100">
                      <div className="flex gap-1.5">
                        <AppBadge variant={w.kycStatus === 'approved' ? 'emerald' : 'amber'} uppercase={false} className="text-[10px]">
                          KYC {w.kycStatus || 'pending'}
                        </AppBadge>
                        <AppBadge variant={w.availability === 'on_site' ? 'brand' : 'neutral'} uppercase={false} className="text-[10px]">
                          {w.availability === 'on_site' ? 'On site' : w.availability === 'leave' ? 'On leave' : 'Available'}
                        </AppBadge>
                      </div>
                      <button 
                        onClick={() => handleRemove(w._id)}
                        className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  </VendorCard>
                </li>
              ))}
            </ul>
          </>
        )}
      </VendorPageLayout>
    </motion.div>
  )
}
