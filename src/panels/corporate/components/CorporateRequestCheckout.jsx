import { useState, useEffect } from 'react'
import { fetchLabourCategoriesGrouped } from '../../../api/labourCategoriesApi.js'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'

export function CorporateRequestCheckout({ 
  vendor, 
  selectedCrew,
  platformFeeConfig,
  onBack, 
  onSubmit, 
  isSubmitting 
}) {
  const [paymentMethod, setPaymentMethod] = useState('ONLINE')

  const [categories, setCategories] = useState([])
  useEffect(() => {
    let cancelled = false
    fetchLabourCategoriesGrouped().then(res => {
      if (!cancelled && res.data?.groups) {
        setCategories(res.data.groups)
      }
    }).catch(console.error)
    return () => { cancelled = true }
  }, [])


  if (!vendor || !selectedCrew) return null

  const { priceDetails } = vendor
  const totalDays = priceDetails?.totalDays || 1

  // Group by category/service, but keep individual labourers
  const breakdownGroups = {}
  let totalGstPerDay = 0
  
  selectedCrew.forEach(worker => {
    const serviceName = worker.serviceName || worker.services?.[0]?.name || worker.category || 'Specialist Labour'
    const categoryName = worker.category || 'General'
    const adminPrice = worker.adminPrice || worker.services?.[0]?.adminPrice || worker.services?.[0]?.price || 0
    const labourName = worker.fullName || 'Labourer'
    
    const key = categoryName + '|' + serviceName

    if (!breakdownGroups[key]) {
      let cat = null
      for (const parent of categories) {
        if (parent.name === categoryName) {
          cat = parent
          break
        }
        for (const sub of parent.categories || []) {
          if (sub.name === categoryName) {
            cat = parent
            break
          }
          for (const srv of sub.services || []) {
            if (srv.name === serviceName || srv.name === categoryName) {
              cat = parent
              break
            }
          }
          if (cat) break
        }
        if (cat) break
      }

      const gstPercent = (cat && cat.isGstActive) ? (cat.gstPercentage || 0) : 0
      
      breakdownGroups[key] = {
        serviceName,
        categoryName,
        labourers: [],
        adminPriceTotal: 0,
        gstPercent,
        gstAmountTotal: 0
      }
    }
    
    breakdownGroups[key].labourers.push({ labourName, adminPrice })
    breakdownGroups[key].adminPriceTotal += adminPrice
    
    const gstAmount = (adminPrice * breakdownGroups[key].gstPercent) / 100
    breakdownGroups[key].gstAmountTotal += gstAmount
    totalGstPerDay += gstAmount
  })
  
  const breakdown = Object.values(breakdownGroups).map(group => ({
    ...group,
    totalAmount: group.adminPriceTotal + group.gstAmountTotal
  }))

  const perDayCost = breakdown.reduce((sum, item) => sum + item.adminPriceTotal, 0)
  const basePriceTotal = perDayCost * totalDays
  const totalTaxAmount = totalGstPerDay * totalDays


  let platformFee = 0
  if (platformFeeConfig) {
    if (platformFeeConfig.type === 'fixed') {
      platformFee = platformFeeConfig.value
    } else if (platformFeeConfig.type === 'percentage') {
      platformFee = (basePriceTotal * platformFeeConfig.value) / 100
    }
  }

  const estimatedTotal = basePriceTotal + platformFee

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Request Summary</h3>
        <p className="text-sm text-slate-500">Review the details before sending your request.</p>
      </div>

      {/* Selected Vendor Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="font-bold text-slate-800">{vendor.businessName}</h4>
        <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
          <span>{vendor.fullName}</span>
          <span>⭐ {vendor.rating?.toFixed(1) || '0.0'}</span>
          {vendor.distance !== undefined && (
            <span>{vendor.distance.toFixed(1)} km away</span>
          )}
        </div>
      </div>

      {/* Billing Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Labour & Tax Details</h4>
          <span className="text-xs font-semibold text-slate-500">{totalDays} Days</span>
        </div>
        
        <div className="space-y-4">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col text-sm border border-slate-100 bg-slate-50/30 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800">{item.serviceName}</span>
                  {item.categoryName && item.categoryName !== item.serviceName && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-400">{item.categoryName}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-500">{item.labourers.length} Labour(s)</span>
              </div>
              
              <div className="px-4 py-2 space-y-2">
                {item.labourers.map((labour, lIdx) => (
                  <div key={lIdx} className="flex justify-between items-center text-xs text-slate-600">
                    <span>{labour.labourName}</span>
                    <span className="font-medium">₹{Math.round(labour.adminPrice)}/day</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Category Subtotal:</span>
                  <span className="font-medium">₹{Math.round(item.adminPriceTotal)}/day</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({item.gstPercent}%):</span>
                  <span className="font-medium">+ ₹{Math.round(item.gstAmountTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-1.5 border-t border-slate-200/50 mt-0.5">
                  <span>Category Total/day:</span>
                  <span className="text-brand">₹{Math.round(item.totalAmount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="my-5 border-t border-slate-200"></div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Base Cost ({totalDays} days)</span>
            <span className="font-medium text-slate-800">₹{basePriceTotal}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Total Taxes (GST)</span>
            <span className="font-medium text-slate-800">₹{Math.round(totalTaxAmount)}</span>
          </div>

          {platformFee > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Platform Fee</span>
              <span className="font-medium text-slate-800">₹{Math.round(platformFee)}</span>
            </div>
          )}
        </div>

        <div className="my-4 border-t-2 border-slate-100"></div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800">Overall Estimated Total</span>
          <span className="text-2xl font-black text-brand">₹{Math.round(estimatedTotal + totalTaxAmount)}</span>
        </div>
      </div>



      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
        <AppPrimaryButton 
          type="button" 
          className="w-full bg-slate-800 hover:bg-slate-900" 
          loading={isSubmitting}
          onClick={() => onSubmit(paymentMethod)}
        >
          Send Request
        </AppPrimaryButton>
        <button 
          type="button" 
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full rounded-xl py-3 text-sm font-bold text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
        >
          Back to Selection
        </button>
      </div>
    </div>
  )
}
