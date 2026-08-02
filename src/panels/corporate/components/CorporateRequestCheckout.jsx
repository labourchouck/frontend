import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'

export function CorporateRequestCheckout({ 
  vendor, 
  selectedCrew,
  platformFeeConfig,
  onBack, 
  onSubmit, 
  isSubmitting 
}) {
  if (!vendor || !selectedCrew) return null

  const { priceDetails } = vendor
  const totalDays = priceDetails?.totalDays || 1

  // Dynamically calculate breakdown based on explicitly selected crew
  const breakdownGroups = {}
  selectedCrew.forEach(worker => {
    if (!breakdownGroups[worker.category]) {
      breakdownGroups[worker.category] = { categoryName: worker.category, quantity: 0, adminPriceTotal: 0 }
    }
    breakdownGroups[worker.category].quantity += 1
    breakdownGroups[worker.category].adminPriceTotal += (worker.adminPrice || 0)
  })

  const breakdown = Object.values(breakdownGroups)
  const perDayCost = breakdown.reduce((sum, item) => sum + item.adminPriceTotal, 0)
  const basePriceTotal = perDayCost * totalDays

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
        <h4 className="mb-4 font-bold text-slate-800">Billing Breakdown</h4>
        
        <div className="space-y-3">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm text-slate-600">
              <span>{item.quantity} × {item.categoryName}</span>
              <span className="font-medium text-slate-800">₹{Math.round(item.adminPriceTotal)} / day</span>
            </div>
          ))}
        </div>

        <div className="my-4 border-t border-slate-100"></div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Total per day</span>
          <span className="font-medium text-slate-800">₹{perDayCost}</span>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
          <span>Total days</span>
          <span className="font-medium text-slate-800">{totalDays} days</span>
        </div>

        {platformFee > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
            <span>Platform Fee</span>
            <span className="font-medium text-slate-800">₹{Math.round(platformFee)}</span>
          </div>
        )}

        <div className="my-4 border-t border-slate-200"></div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800">Overall Estimated Total</span>
          <span className="text-lg font-extrabold text-brand">₹{estimatedTotal}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
        <AppPrimaryButton 
          type="button" 
          className="w-full bg-slate-800 hover:bg-slate-900" 
          loading={isSubmitting}
          onClick={onSubmit}
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
