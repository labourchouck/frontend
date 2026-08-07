import { useState, useMemo } from 'react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { Check } from 'lucide-react'

export function CorporateRequestLabourSelection({
  vendor,
  requestedLines,
  onBack,
  onProceed,
}) {
  const [selectedIds, setSelectedIds] = useState([])

  // Calculate required quantities per category
  const requirements = useMemo(() => {
    const reqs = {}
    requestedLines.forEach(line => {
      // Find category name from vendor's priceDetails.breakdown since we need category names
      const breakdown = vendor.priceDetails?.breakdown?.find(b => b.categoryId === line.categoryId)
      if (breakdown) {
        reqs[breakdown.categoryName] = (reqs[breakdown.categoryName] || 0) + Number(line.quantity)
      }
    })
    return reqs
  }, [requestedLines, vendor])

  // Group vendor's available crew by category
  const crewByCategory = useMemo(() => {
    const groups = {}
    ;(vendor.availableCrew || []).forEach(worker => {
      if (!groups[worker.category]) {
        groups[worker.category] = []
      }
      groups[worker.category].push(worker)
    })
    return groups
  }, [vendor])

  // Check if exactly the required number of workers are selected for each category
  const isValidSelection = useMemo(() => {
    for (const [catName, reqQty] of Object.entries(requirements)) {
      const selectedForCat = (crewByCategory[catName] || []).filter(w => selectedIds.includes(w._id)).length
      if (selectedForCat !== reqQty) {
        return false
      }
    }
    return true
  }, [requirements, crewByCategory, selectedIds])

  const toggleSelection = (workerId, categoryName) => {
    setSelectedIds(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId)
      } else {
        // Enforce max selection per category
        const reqQty = requirements[categoryName] || 0
        const currentlySelected = (crewByCategory[categoryName] || []).filter(w => prev.includes(w._id)).length
        if (currentlySelected >= reqQty) {
          return prev // Already at max, do not select
        }
        return [...prev, workerId]
      }
    })
  }

  const handleProceed = () => {
    if (isValidSelection) {
      // Pass the selected worker objects to the next step
      const selectedWorkers = (vendor.availableCrew || []).filter(w => selectedIds.includes(w._id))
      onProceed(selectedWorkers)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Select Labourers</h3>
        <p className="text-sm text-slate-500">
          Choose the specific workers from <strong>{vendor.businessName}</strong> you wish to hire.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(requirements).map(([catName, reqQty]) => {
          const availableWorkers = crewByCategory[catName] || []
          const selectedCount = availableWorkers.filter(w => selectedIds.includes(w._id)).length
          const isSatisfied = selectedCount === reqQty

          return (
            <div key={catName} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-800">{catName}</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${isSatisfied ? 'bg-brand/10 text-brand' : 'bg-orange-100 text-orange-700'}`}>
                  {selectedCount} / {reqQty} Selected
                </span>
              </div>
              <div className="p-3">
                {availableWorkers.length === 0 ? (
                  <p className="text-sm text-slate-500 px-2 py-2">No available workers for this category.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableWorkers.map(worker => {
                      const isSelected = selectedIds.includes(worker._id)
                      const isDisabled = !isSelected && selectedCount >= reqQty

                      return (
                        <div
                          key={worker._id}
                          onClick={() => !isDisabled && toggleSelection(worker._id, catName)}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-brand bg-brand/5 ring-1 ring-brand' 
                              : isDisabled 
                                ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                                : 'border-slate-200 hover:border-brand/30'
                          }`}
                        >
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'bg-brand border-brand' : 'border-slate-300'}`}>
                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-sm text-slate-800 truncate">{worker.fullName}</h5>
                            <p className="text-xs font-semibold text-brand mt-0.5 truncate">
                              {worker.serviceName || worker.services?.[0]?.name || worker.category}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">₹{worker.adminPrice} / day</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <AppPrimaryButton 
          type="button" 
          className={`w-full ${isValidSelection ? 'bg-brand hover:bg-brand/90' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`} 
          onClick={handleProceed}
          disabled={!isValidSelection}
        >
          Send Request
        </AppPrimaryButton>
        <button 
          type="button" 
          onClick={onBack}
          className="w-full rounded-xl py-3 text-sm font-bold text-slate-500 transition hover:text-slate-700"
        >
          Back to Vendor Selection
        </button>
      </div>
    </div>
  )
}
