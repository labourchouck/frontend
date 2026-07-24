import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { getVendorBuildmartProductById } from '../../../api/vendorBuildmartApi.js'

const Backdrop = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm"
  />
)

export function VendorMartProductViewModal({ isOpen, onClose, product }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true)
      getVendorBuildmartProductById(product.id || product._id)
        .then(res => setDetails(res?.data || res))
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setDetails(null)
    }
  }, [isOpen, product])

  const displayData = details || product

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop onClick={onClose} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-4">
                <h2 className="text-lg font-black text-slate-900">Product Full Details</h2>
                <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loading && !details ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-bm-terracotta" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Basic Info Header */}
                    <div className="flex gap-4">
                      <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {displayData?.images?.[0] ? (
                          <img src={displayData.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900">{displayData?.name}</h3>
                            <p className="text-sm font-medium text-slate-500">{displayData?.brand}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                            displayData?.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            displayData?.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {displayData?.status || 'PENDING'}
                          </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-bm-terracotta">{displayData?.priceLabel}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-md bg-slate-100 px-2 py-1">ID: {displayData?.id}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-1">Category: {displayData?.categoryId}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-1">Availability: {displayData?.availability}</span>
                        </div>
                      </div>
                    </div>

                    {displayData?.status === 'REJECTED' && displayData?.rejectionReason && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-800">Rejection Reason:</p>
                        <p className="mt-1 text-sm text-red-600">{displayData.rejectionReason}</p>
                      </div>
                    )}

                    {/* Descriptions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-2">Short Description</h4>
                        <p className="text-sm text-slate-600">{displayData?.shortDescription || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-2">Delivery Info</h4>
                        <p className="text-sm text-slate-600">{displayData?.deliveryInfo || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-2">Full Description</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{displayData?.description || 'N/A'}</p>
                    </div>

                    {/* Specs */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-2">Specifications</h4>
                      {displayData?.specs?.length > 0 ? (
                        <div className="space-y-2">
                          {displayData.specs.map((spec, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">{spec.label}</span>
                              <span className="text-slate-900 font-semibold">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No specifications.</p>
                      )}
                    </div>

                    {/* Variants */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3 flex items-center justify-between">
                        <span>Variants</span>
                        <span className="text-xs text-slate-500 font-medium">{displayData?.variantCount || 0} variants</span>
                      </h4>
                      {displayData?.variants?.length > 0 ? (
                        <div className="space-y-3">
                          {displayData.variants.map((v, i) => (
                            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                              <div className="flex justify-between font-bold text-slate-900 mb-2">
                                <span>{v.label} {v.size ? `(${v.size} ${v.unit || ''})` : ''}</span>
                                <span>ID: {v.id}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div className="bg-white p-2 rounded border border-slate-100">
                                  <span className="block text-slate-400 font-medium mb-0.5">Retail</span>
                                  <span className="font-semibold text-slate-700">₹{v.retailPrice || 0}</span>
                                </div>
                                <div className="bg-white p-2 rounded border border-slate-100">
                                  <span className="block text-slate-400 font-medium mb-0.5">Contractor</span>
                                  <span className="font-semibold text-slate-700">₹{v.contractorPrice || 0}</span>
                                </div>
                                <div className="bg-white p-2 rounded border border-slate-100">
                                  <span className="block text-slate-400 font-medium mb-0.5">Bulk</span>
                                  <span className="font-semibold text-slate-700">₹{v.bulkPrice || 0}</span>
                                </div>
                                <div className="bg-white p-2 rounded border border-slate-100">
                                  <span className="block text-slate-400 font-medium mb-0.5">MOQ</span>
                                  <span className="font-semibold text-slate-700">{v.moq || 0}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No variants defined.</p>
                      )}
                    </div>

                    {/* All Images */}
                    {displayData?.images?.length > 1 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 border-b pb-2 mb-3">All Images</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {displayData.images.map((img, i) => (
                            <a href={img} target="_blank" rel="noopener noreferrer" key={i} className="aspect-square overflow-hidden rounded-xl bg-slate-100 hover:opacity-90 transition">
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex justify-between border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-400">
                      <span>Created: {new Date(displayData?.createdAt).toLocaleString()}</span>
                      <span>Updated: {new Date(displayData?.updatedAt).toLocaleString()}</span>
                    </div>

                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
