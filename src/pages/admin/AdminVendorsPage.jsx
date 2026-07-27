import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, UserCircle2, Wrench, Users } from 'lucide-react'
import { fetchAdminVendorsAndCrew } from '../../api/adminVendorApi.js'
import { AppSurface } from '../../components/app-ui/cards/AppSurface.jsx'

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedVendorIds, setExpandedVendorIds] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    fetchAdminVendorsAndCrew()
      .then((res) => {
        if (!cancelled) {
          setVendors(res.data?.vendors || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load vendors')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleVendor = (vendorId) => {
    setExpandedVendorIds(prev => {
      const next = new Set(prev)
      if (next.has(vendorId)) next.delete(vendorId)
      else next.add(vendorId)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800">Vendors & Crew</h1>
        <p className="text-sm font-medium text-slate-500">View vendors, their linked crew members, and the services they provide.</p>
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
                      {vendor.crew?.length || 0} crew members
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
                      No crew members linked to this vendor yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendor.crew?.map(crew => (
                        <div key={crew._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserCircle2 className="size-8 text-slate-400 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-bold text-slate-800 truncate">{crew.fullName || '—'}</span>
                                <div className="flex flex-col mt-0.5 text-[11px] font-medium text-slate-500">
                                  <span className="truncate">{crew.email || 'No email'}</span>
                                  <span>{crew.phone ? `+91 ${crew.phone}` : 'No phone'}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              {crew.labourProfile?.kycStatus === 'verified' ? 'KYC Verified' : crew.labourProfile?.kycStatus}
                            </span>
                          </div>

                          {crew.labourProfile?.categoryIds?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Categories</p>
                              <div className="flex flex-wrap gap-1.5">
                                {crew.labourProfile.categoryIds.map(c => (
                                  <span key={c._id} className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {crew.labourProfile?.servicePricing?.length > 0 && (
                            <div>
                              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Services & Pricing</p>
                              <div className="flex flex-col gap-1.5">
                                {crew.labourProfile.servicePricing.map((sp, idx) => {
                                  let serviceName = 'Unknown Service'
                                  if (typeof sp.serviceId === 'object' && sp.serviceId?.name) {
                                    serviceName = sp.serviceId.name
                                  } else if (sp.serviceId) {
                                    const found = crew.labourProfile.serviceIds?.find(s => s._id === sp.serviceId)
                                    if (found) serviceName = found.name
                                  }
                                  if (serviceName === 'Unknown Service') {
                                    if (typeof sp.subcategoryId === 'object' && sp.subcategoryId?.name) {
                                      serviceName = sp.subcategoryId.name
                                    } else {
                                      const found = crew.labourProfile.subcategoryIds?.find(s => s._id === sp.subcategoryId)
                                      if (found) serviceName = found.name
                                    }
                                  }
                                  return (
                                    <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2">
                                      <div className="flex items-center gap-1.5">
                                        <Wrench className="size-3 text-brand" />
                                        <span className="text-[11px] font-bold text-slate-700">{serviceName}</span>
                                      </div>
                                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                                        ₹{sp.minPrice} – ₹{sp.maxPrice}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
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
    </div>
  )
}
