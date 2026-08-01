import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, UserCircle2, Wrench, Users, Eye, Edit2, Trash2, X } from 'lucide-react'
import { fetchAdminVendorsAndCrew, updateVendorCrewVerification, deleteVendorCrew } from '../../api/adminVendorApi.js'
import { AppSurface } from '../../components/app-ui/cards/AppSurface.jsx'
import { AppBadge } from '../../components/app-ui/data-display/AppBadge.jsx'

function AdminVendorCrewVerificationModal({ isOpen, onClose, crew, onUpdated }) {
  const [status, setStatus] = useState('pending')
  const [rejectMessage, setRejectMessage] = useState('')
  const [adminPrices, setAdminPrices] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (crew) {
      setStatus(crew.verificationStatus || 'pending')
      setRejectMessage(crew.rejectMessage || '')
      
      const initialPrices = {}
      crew.services?.forEach(s => {
        initialPrices[s.name] = s.adminPrice || s.price || 0
      })
      setAdminPrices(initialPrices)
    }
  }, [crew])

  if (!isOpen || !crew) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const pricesArray = Object.keys(adminPrices).map(name => ({
        name,
        adminPrice: Number(adminPrices[name])
      }))
      
      await updateVendorCrewVerification(crew._id, {
        status,
        rejectMessage,
        adminPrices: pricesArray
      })
      onUpdated()
      onClose()
    } catch (err) {
      alert(err.message || 'Failed to update verification status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">Crew Request Verification</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Worker Details</p>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-slate-800">{crew.fullName}</p>
                <p className="text-sm text-slate-600 mt-1">{crew.phone}</p>
                {crew.address && <p className="text-xs text-slate-500 mt-1">{crew.address}</p>}
                {crew.category && (
                  <span className="inline-block mt-2 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700">
                    {crew.category}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Services & Pricing</p>
              <div className="space-y-2">
                {crew.services?.map(s => (
                  <div key={s.name} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Vendor Price: ₹{s.price}</p>
                    </div>
                    <div className="w-32 shrink-0">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Admin Price (₹)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={adminPrices[s.name] ?? ''}
                        onChange={(e) => setAdminPrices(prev => ({ ...prev, [s.name]: e.target.value }))}
                        className="w-full rounded-lg border-slate-200 text-sm focus:border-brand focus:ring-brand p-2 border outline-none"
                      />
                    </div>
                  </div>
                ))}
                {(!crew.services || crew.services.length === 0) && (
                  <p className="text-sm text-slate-500 italic">No services listed.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verification Action</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border-slate-200 p-3 text-sm focus:border-brand focus:ring-brand border outline-none bg-white"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            {status === 'rejected' && (
              <div>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Rejection Reason</p>
                <textarea
                  required
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Explain why this request is rejected..."
                  className="w-full rounded-xl border-rose-200 p-3 text-sm focus:border-rose-500 focus:ring-rose-500 border outline-none min-h-[100px]"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedVendorIds, setExpandedVendorIds] = useState(new Set())
  const [modalState, setModalState] = useState({ isOpen: false, crew: null })

  const loadData = () => {
    fetchAdminVendorsAndCrew()
      .then((res) => {
        setVendors(res.data?.vendors || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load vendors')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleVendor = (vendorId) => {
    setExpandedVendorIds(prev => {
      const next = new Set(prev)
      if (next.has(vendorId)) next.delete(vendorId)
      else next.add(vendorId)
      return next
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crew request?')) return
    try {
      await deleteVendorCrew(id)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800">Vendors & Crew Requests</h1>
        <p className="text-sm font-medium text-slate-500">Review vendor crew profiles and approve their service requests.</p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
          {error}
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <Users className="mb-4 size-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-700">No vendors found</h3>
          <p className="mt-1 text-sm text-slate-500">There are no verified vendors available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <AppSurface key={vendor._id} className="overflow-hidden">
              <button
                onClick={() => toggleVendor(vendor._id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      {vendor.contractorProfile?.companyName || vendor.fullName}
                    </h3>
                    {vendor.contractorProfile?.verificationStatus === 'approved' && (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-[11px] font-medium text-slate-500">
                    <span>{vendor.phone}</span>
                    <span>{vendor.email}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 uppercase tracking-wider text-slate-600">
                      {vendor.contractorProfile?.businessType || 'Contractor'}
                    </span>
                    <span className="font-bold text-brand">
                      {vendor.crew?.length || 0} crew requests
                    </span>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedVendorIds.has(vendor._id) ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
                </div>
              </button>

              {expandedVendorIds.has(vendor._id) && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  {vendor.crew?.length === 0 ? (
                    <div className="text-center text-[11px] font-medium text-slate-500 py-4">
                      No crew requests for this vendor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendor.crew?.map(crew => (
                        <div key={crew._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserCircle2 className="size-8 text-slate-400 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-bold text-slate-800 truncate">{crew.fullName || '—'}</span>
                                <span className="text-[11px] font-mono text-slate-500">{crew.phone}</span>
                              </div>
                            </div>
                            <AppBadge 
                              variant={
                                crew.verificationStatus === 'approved' ? 'emerald' : 
                                crew.verificationStatus === 'rejected' ? 'rose' : 'amber'
                              } 
                              uppercase={false} 
                              className="text-[10px] font-bold px-2 py-0.5 shrink-0"
                            >
                              {crew.verificationStatus === 'approved' ? 'Approved' : 
                               crew.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                            </AppBadge>
                          </div>

                          {crew.category && (
                            <div className="mb-3">
                              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Category</p>
                              <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                                {crew.category}
                              </span>
                            </div>
                          )}

                          {crew.services?.length > 0 && (
                            <div className="mb-4 flex-1">
                              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Services & Pricing</p>
                              <div className="flex flex-col gap-1.5">
                                {crew.services.map((sp, idx) => (
                                  <div key={idx} className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Wrench className="size-3 text-brand" />
                                      <span className="text-[11px] font-bold text-slate-700 truncate">{sp.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-slate-500">Vendor:</span>
                                        <span className="text-[10px] font-bold text-slate-700">₹{sp.price}</span>
                                      </div>
                                      {sp.adminPrice !== undefined && sp.adminPrice !== null && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] text-brand">Admin:</span>
                                          <span className="text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">₹{sp.adminPrice}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-auto">
                            <button 
                              onClick={() => setModalState({ isOpen: true, crew })}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-100"
                              title="View & Verify"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setModalState({ isOpen: true, crew })}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition border border-amber-100"
                              title="Edit Verification"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(crew._id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition border border-rose-100"
                              title="Delete Request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </AppSurface>
          ))}
        </div>
      )}

      <AdminVendorCrewVerificationModal 
        isOpen={modalState.isOpen}
        crew={modalState.crew}
        onClose={() => setModalState({ isOpen: false, crew: null })}
        onUpdated={loadData}
      />
    </div>
  )
}
