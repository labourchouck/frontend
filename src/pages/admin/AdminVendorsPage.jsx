import { useEffect, useState, useMemo } from 'react'
import { Search, Eye, Edit2, Trash2, X, Users, Wrench, CheckCircle2 } from 'lucide-react'
import { fetchAdminVendorsAndCrew, updateVendorCrewVerification, deleteVendorCrew, fetchAdminVendorCrewById } from '../../api/adminVendorApi.js'
import { AppSurface } from '../../components/app-ui/cards/AppSurface.jsx'
import { AppBadge } from '../../components/app-ui/data-display/AppBadge.jsx'

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

function AdminVendorCrewVerificationModal({ isOpen, onClose, crew, initialAction, inlinePrices, onUpdated }) {
  const [status, setStatus] = useState('pending')
  const [rejectMessage, setRejectMessage] = useState('')
  const [adminPrices, setAdminPrices] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (crew) {
      if (initialAction === 'approved') setStatus('approved')
      else if (initialAction === 'rejected') setStatus('rejected')
      else setStatus(crew.verificationStatus || 'pending')

      setRejectMessage(crew.rejectMessage || '')
      
      const initialPrices = {}
      crew.services?.forEach(s => {
        const inlineKey = `${crew._id}_${s.name}`
        if (inlinePrices && inlinePrices[inlineKey] !== undefined && inlinePrices[inlineKey] !== '') {
          initialPrices[s.name] = inlinePrices[inlineKey]
        } else {
          initialPrices[s.name] = s.adminPrice || s.price || 0
        }
      })
      setAdminPrices(initialPrices)
    }
  }, [crew, initialAction, inlinePrices])

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vendor Details</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 h-full">
                  <p className="font-bold text-slate-800">{crew.vendorName || '—'}</p>
                  <p className="text-sm text-slate-600 mt-1">{crew.vendorPhone || '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">{crew.vendorEmail || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Worker Details</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 h-full">
                  <p className="font-bold text-slate-800">{crew.fullName}</p>
                  <p className="text-sm text-slate-600 mt-1">{crew.phone}</p>
                  {crew.address && <p className="text-xs text-slate-500 mt-1">{crew.address}</p>}
                  {(crew.city || crew.state) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[crew.city, crew.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {crew.category && (
                    <span className="inline-block mt-2 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700">
                      {crew.category}
                    </span>
                  )}
                </div>
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
  const [allCrewRequests, setAllCrewRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 400)
  
  const [inlineAdminPrices, setInlineAdminPrices] = useState({})

  const [modalState, setModalState] = useState({ isOpen: false, crew: null, action: null, inlinePrices: null })

  const loadData = () => {
    fetchAdminVendorsAndCrew()
      .then((res) => {
        const vendors = res.data?.vendors || []
        const flattenedCrew = []
        vendors.forEach(vendor => {
          if (vendor.crew && vendor.crew.length > 0) {
            vendor.crew.forEach(c => {
              flattenedCrew.push({
                ...c,
                vendorName: vendor.contractorProfile?.companyName || vendor.fullName,
                vendorPhone: vendor.phone,
                vendorEmail: vendor.email
              })
            })
          }
        })
        setAllCrewRequests(flattenedCrew)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load vendor crew requests')
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crew request?')) return
    try {
      await deleteVendorCrew(id)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete')
    }
  }

  const handlePriceBlur = async (crew, serviceName, val) => {
    if (val === '' || val === null) return
    try {
      const pricesArray = crew.services.map(s => {
         if (s.name === serviceName) return { name: s.name, adminPrice: Number(val) }
         return { name: s.name, adminPrice: Number(inlineAdminPrices[`${crew._id}_${s.name}`] ?? s.adminPrice ?? 0) }
      })
      await updateVendorCrewVerification(crew._id, {
        status: crew.verificationStatus || 'pending',
        adminPrices: pricesArray
      })
    } catch (e) {
      console.error('Failed to update price inline', e)
    }
  }

  const handleApprove = async (crew) => {
    try {
      const pricesArray = crew.services.map(s => {
         return { name: s.name, adminPrice: Number(inlineAdminPrices[`${crew._id}_${s.name}`] ?? s.adminPrice ?? 0) }
      })
      await updateVendorCrewVerification(crew._id, {
        status: 'approved',
        adminPrices: pricesArray
      })
      loadData()
    } catch (e) {
      alert(e.message || 'Failed to approve request')
    }
  }

  const handleView = async (crew) => {
    try {
      const res = await fetchAdminVendorCrewById(crew._id)
      setModalState({ isOpen: true, crew: res.data?.crew || crew, action: 'view', inlinePrices: inlineAdminPrices })
    } catch (e) {
      setModalState({ isOpen: true, crew, action: 'view', inlinePrices: inlineAdminPrices })
    }
  }

  const filteredCrew = useMemo(() => {
    let filtered = allCrewRequests.filter(c => (c.verificationStatus || 'pending') === activeTab)
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        (c.vendorName || '').toLowerCase().includes(q) ||
        (c.fullName || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
      )
    }
    return filtered
  }, [allCrewRequests, activeTab, debouncedSearchQuery])

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800">Vendors & Crew Requests</h1>
        <p className="text-sm font-medium text-slate-500">Review vendor crew profiles, approve or reject their requests.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
          {['pending', 'approved', 'rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:px-6 py-2.5 text-sm font-bold capitalize rounded-lg transition-colors ${
                activeTab === tab ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            placeholder="Search vendor, labour, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
          {error}
        </div>
      ) : filteredCrew.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <Users className="mb-4 size-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-700">No requests found</h3>
          <p className="mt-1 text-sm text-slate-500">No crew requests match the current filters.</p>
        </div>
      ) : (
        <AppSurface className="overflow-x-auto rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Labour Name & Mobile</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Services</th>
                <th className="px-6 py-4">Vendor Price</th>
                <th className="px-6 py-4">Admin Price</th>
                <th className="px-6 py-4">Price Difference</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCrew.map((crew) => (
                <tr key={crew._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{crew.vendorName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{crew.vendorPhone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{crew.fullName}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{crew.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                      {crew.category || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {crew.services?.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {crew.services.map((sp, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 h-8">
                            <Wrench className="size-3 text-brand shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]" title={sp.name}>{sp.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">No services</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {crew.services?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {crew.services.map((sp, idx) => (
                          <div key={idx} className="flex items-center h-8">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">₹{sp.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {crew.services?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {crew.services.map((sp, idx) => {
                          const inputVal = inlineAdminPrices[`${crew._id}_${sp.name}`] ?? sp.adminPrice ?? ''
                          return (
                            <div key={idx} className="flex items-center h-8">
                              <input
                                type="number"
                                min="0"
                                placeholder="₹ Price"
                                className="w-20 rounded border border-slate-200 px-2 py-1 text-[11px] outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium text-slate-700"
                                value={inputVal}
                                onChange={(e) => setInlineAdminPrices(prev => ({ ...prev, [`${crew._id}_${sp.name}`]: e.target.value }))}
                                onBlur={(e) => handlePriceBlur(crew, sp.name, e.target.value)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {crew.services?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {crew.services.map((sp, idx) => {
                          const inputVal = inlineAdminPrices[`${crew._id}_${sp.name}`] ?? sp.adminPrice ?? ''
                          const diff = (inputVal !== '' && inputVal !== null) ? Number(inputVal) - (sp.price || 0) : null
                          return (
                            <div key={idx} className="flex items-center h-8">
                              {diff !== null ? (
                                <span className={`text-[11px] font-bold px-2 py-1 rounded ${diff > 0 ? 'text-emerald-700 bg-emerald-50' : diff < 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-100'}`}>
                                  {diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : '₹0'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">—</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(crew)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-100 shadow-sm"
                        title="View Details"
                      >
                        <Eye className="size-4" />
                      </button>

                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(crew)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition border border-emerald-100 shadow-sm"
                            title="Approve Request"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                          <button
                            onClick={() => setModalState({ isOpen: true, crew, action: 'rejected', inlinePrices: inlineAdminPrices })}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition border border-rose-100 shadow-sm"
                            title="Reject Request"
                          >
                            <X className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppSurface>
      )}

      <AdminVendorCrewVerificationModal 
        isOpen={modalState.isOpen}
        crew={modalState.crew}
        initialAction={modalState.action}
        inlinePrices={modalState.inlinePrices}
        onClose={() => setModalState({ isOpen: false, crew: null, action: null, inlinePrices: null })}
        onUpdated={loadData}
      />
    </div>
  )
}
