import React from 'react'
import { XCircle, Calendar, Phone, Briefcase, IndianRupee, MapPin, Loader2 } from 'lucide-react'
import { useGetAdminRequestByIdQuery } from '../../../store/api/workforceApi.js'

export function AdminCorporateRequestViewModal({ request: initialRequest, onClose }) {
  if (!initialRequest) return null

  const { data: requestData, isLoading } = useGetAdminRequestByIdQuery(initialRequest._id, {
    skip: !initialRequest._id,
  })

  const request = requestData?.request || requestData || initialRequest

  const assignments = request.assignments || []
  const requestedCrew = request.preferredCrewIds || []
  const assignedVendor = request.preferredVendorId || (assignments.length > 0 ? assignments[0].vendorId : null)

  const corporate = request.clientId

  let sumVendorPrice = 0
  let sumPriceDiff = 0
  let sumAdminPrice = 0
  
  const activeList = requestedCrew.length > 0 ? requestedCrew : assignments
  activeList.forEach(item => {
    let vFee = 0
    let aFee = 0
    if (requestedCrew.length > 0) {
      vFee = item.services?.[0]?.price || 0
      aFee = item.services?.[0]?.adminPrice || item.adminPrice || 0
    } else {
      vFee = item.labourId?.services?.[0]?.price || 0
      aFee = item.labourId?.services?.[0]?.adminPrice || 0
    }
    const pDiff = aFee > vFee ? aFee - vFee : 0
    sumVendorPrice += vFee
    sumPriceDiff += pDiff
    sumAdminPrice += aFee
  })

  const taxAmount = requestData?.pricingSummary?.taxAmount ?? request.taxAmount ?? 0
  const platformFee = requestData?.pricingSummary?.platformFee ?? request.platformFee ?? 0
  const totalAmount = requestData?.pricingSummary?.estimatedTotal ?? request.totalAmount ?? (sumAdminPrice + taxAmount + platformFee)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 md:p-8 shadow-xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-rose-600 transition"
        >
          <XCircle className="w-7 h-7" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading details...</p>
          </div>
        ) : (
          <>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Request {request.reference}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {request.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(request.startDate).toLocaleDateString()} 
            {request.endDate && ` to ${new Date(request.endDate).toLocaleDateString()}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Corporate Details */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand" /> Corporate Client
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Company Name</p>
                <p className="font-semibold">{corporate?.corporateProfile?.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Contact Person</p>
                <p className="font-semibold">{corporate?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Phone Number</p>
                <p className="font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {corporate?.phone || 'N/A'}
                </p>
              </div>
              {request.siteLocation && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Site Location</p>
                  <p className="font-semibold flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" /> 
                    {request.siteLocation.address || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Details */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" /> Assigned Vendor
            </h3>
            {assignedVendor ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Business Name</p>
                  <p className="font-semibold">{assignedVendor.contractorProfile?.businessName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Vendor Name</p>
                  <p className="font-semibold">{assignedVendor.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Phone Number</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {assignedVendor.phone || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm py-8">
                No vendor assigned yet
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Crew Details */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-amber-600" /> Crew & Pricing Details
          </h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 font-bold">Worker</th>
                  <th className="p-4 font-bold">Service</th>
                  <th className="p-4 font-bold text-right">Vendor Price/Day</th>
                  <th className="p-4 font-bold text-right">Price Difference</th>
                  <th className="p-4 font-bold text-right bg-brand/5">Total Admin Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requestedCrew.length > 0 ? (
                  requestedCrew.map(c => {
                    const vendorFee = c.services?.[0]?.price || 0;
                    const adminFee = c.services?.[0]?.adminPrice || c.adminPrice || 0;
                    const priceDiff = adminFee > vendorFee ? adminFee - vendorFee : 0;
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{c.fullName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{c.phone}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold text-slate-600">
                            {c.services?.[0]?.name || c.category || 'Specialist'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-700">₹{vendorFee.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-semibold text-brand">₹{priceDiff.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900 bg-brand/5">₹{adminFee.toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })
                ) : assignments.length > 0 ? (
                  assignments.map(a => {
                    const vendorFee = a.labourId?.services?.[0]?.price || 0;
                    const adminFee = a.labourId?.services?.[0]?.adminPrice || 0;
                    const priceDiff = adminFee > vendorFee ? adminFee - vendorFee : 0;
                    return (
                      <tr key={a._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{a.labourId?.fullName || 'Pending'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{a.labourId?.phone || 'Awaiting Worker'}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold text-slate-600">
                            {a.labourId?.services?.[0]?.name || a.labourId?.category || 'Worker'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-700">₹{vendorFee.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-semibold text-brand">₹{priceDiff.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900 bg-brand/5">₹{adminFee.toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                      No crew assigned or requested yet.
                    </td>
                  </tr>
                )}
              </tbody>
              {(requestedCrew.length > 0 || assignments.length > 0) && (
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={2} className="p-4 text-right font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                      Subtotals
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-800">₹{sumVendorPrice.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-extrabold text-brand">₹{sumPriceDiff.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-black text-slate-900 bg-brand/5">₹{sumAdminPrice.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-4 text-right font-bold text-slate-600 text-xs">Platform Fee</td>
                    <td className="p-4 text-right font-bold text-slate-900 bg-brand/5">₹{platformFee.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-4 text-right font-bold text-slate-600 text-xs">GST</td>
                    <td className="p-4 text-right font-bold text-slate-900 bg-brand/5">₹{taxAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-200 bg-brand/10">
                    <td colSpan={4} className="p-4 text-right font-black text-brand uppercase tracking-wider text-sm">
                      Total Amount
                    </td>
                    <td className="p-4 text-right font-black text-brand text-lg">₹{totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  )
}
