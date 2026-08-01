import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Plus, ShieldCheck, Users, Eye, Edit2, Trash2 } from 'lucide-react'
import { AppEmptyState } from '../../../components/app/AppEmptyState.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppBadge } from '../../../components/app-ui/data-display/AppBadge.jsx'
import { AppSectionHeader } from '../../../components/app-ui/layout/AppSectionHeader.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { VENDOR_DUMMY_CREW } from '../../../lib/vendorDummyData.js'
import { useEffect, useState } from 'react'
import { vendorApi } from '../../../api/vendorApi.js'
import { VendorCrewWorkerModal } from '../components/VendorCrewWorkerModal.jsx'

export function VendorCrewPage() {
  const reduce = useReducedMotion()
  const [crew, setCrew] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, workerId: null, mode: 'view' })

  const fetchCrew = async () => {
    try {
      const res = await vendorApi.getCrewLabour()
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
      await vendorApi.deleteCrewLabour(id)
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

        <VendorCard className="flex gap-3 border-brand/15 bg-brand/5 mt-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          <p className="min-w-0 text-xs leading-relaxed text-slate-600">
            Create profiles for your crew members after verifying their mobile numbers.
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
                  <VendorCard className="space-y-3">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{w.fullName}</p>
                          <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">{w.phone}</p>
                          {w.address && <p className="text-[10px] text-slate-400 mt-1">{w.address}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <AppBadge 
                            variant={
                              w.verificationStatus === 'approved' ? 'emerald' : 
                              w.verificationStatus === 'rejected' ? 'rose' : 'amber'
                            } 
                            uppercase={false} 
                            className="text-[10px] font-bold px-2 py-1"
                          >
                            {w.verificationStatus === 'approved' ? 'Approved' : 
                             w.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}
                          </AppBadge>
                          <AppBadge variant={w.status === 'active' ? 'emerald' : 'rose'} uppercase={false} className="text-[10px] font-bold px-2 py-1">
                            {w.status === 'active' ? 'Active' : 'Inactive'}
                          </AppBadge>
                        </div>
                      </div>

                      {w.verificationStatus === 'rejected' && w.rejectMessage && (
                        <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-3">
                          <p className="text-xs font-bold text-rose-700">Rejection Reason</p>
                          <p className="text-xs text-rose-600 mt-1">{w.rejectMessage}</p>
                        </div>
                      )}

                      {w.category && (
                        <div className="mt-3">
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Category</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                             <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{w.category}</span>
                          </div>
                        </div>
                      )}

                      {w.services?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Services & Pricing</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {w.services.map((sp, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 transition-all hover:bg-white hover:shadow-sm hover:border-brand/30">
                                  <span className="text-[11px] font-bold text-slate-700 truncate mr-2">
                                    {sp.name}
                                  </span>
                                  <span className="shrink-0 rounded-md bg-brand/10 px-2 py-1 text-[10px] font-extrabold text-brand">
                                    ₹{sp.price}
                                  </span>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => setModalState({ isOpen: true, workerId: w._id, mode: 'view' })}
                        className="flex h-8 w-8 items-center justify-center text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition shadow-sm"
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setModalState({ isOpen: true, workerId: w._id, mode: 'edit' })}
                        className="flex h-8 w-8 items-center justify-center text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition shadow-sm"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleRemove(w._id)}
                        className="flex h-8 w-8 items-center justify-center text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition shadow-sm"
                        title="Delete Worker"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </VendorCard>
                </li>
              ))}
            </ul>
          </>
        )}
      </VendorPageLayout>

      <VendorCrewWorkerModal
        isOpen={modalState.isOpen}
        workerId={modalState.workerId}
        mode={modalState.mode}
        onClose={() => setModalState({ isOpen: false, workerId: null, mode: 'view' })}
        onUpdated={() => {
          fetchCrew() // refresh list after update
        }}
      />
    </motion.div>
  )
}
