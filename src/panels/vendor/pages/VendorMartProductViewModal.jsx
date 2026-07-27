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
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto border border-orange-100"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-orange-100/50 bg-white p-4">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Product Full Details</h2>
                <button onClick={onClose} className="rounded-full bg-orange-50 p-2 text-bm-orange transition hover:bg-orange-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 buildmart-gradient-soft">
                {loading && !details ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-bm-terracotta" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Main Image Card */}
                    <div className="rounded-3xl border border-orange-100/90 bg-white shadow-sm overflow-hidden aspect-video relative ring-1 ring-slate-100">
                      {displayData?.images?.[0] ? (
                        <img src={displayData.images[0]} alt="" className="absolute inset-0 h-full w-full object-contain bg-slate-50" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm font-bold uppercase bg-slate-50">No Image</div>
                      )}
                    </div>

                    {/* Basic Info Header */}
                    <div className="rounded-3xl border border-orange-100/90 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-4">
                          <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{displayData?.name}</h3>
                          <p className="text-sm font-bold text-slate-500 mt-1">{displayData?.brand}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          displayData?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' :
                          displayData?.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-1 ring-red-200/80' :
                          'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80'
                        }`}>
                          {displayData?.status || 'PENDING'}
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-extrabold text-bm-terracotta">{displayData?.priceLabel}</p>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase text-bm-orange ring-1 ring-orange-200/50">ID: {displayData?.id}</span>
                        <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase text-slate-600 ring-1 ring-slate-200/80">Category: {displayData?.categoryId}</span>
                        <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase text-slate-600 ring-1 ring-slate-200/80">Stock: {displayData?.availability}</span>
                      </div>
                    </div>

                    {displayData?.status === 'REJECTED' && displayData?.rejectionReason && (
                      <div className="rounded-3xl border border-red-200/80 bg-red-50 p-4 shadow-sm">
                        <p className="text-sm font-extrabold text-red-900">Rejection Reason</p>
                        <p className="mt-1 text-sm text-red-700 leading-relaxed font-medium">{displayData.rejectionReason}</p>
                      </div>
                    )}

                    {/* Descriptions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-2 text-bm-terracotta">Short Description</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{displayData?.shortDescription || 'N/A'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-2 text-bm-terracotta">Delivery Info</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{displayData?.deliveryInfo || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-2 text-bm-terracotta">Full Description</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">{displayData?.description || 'N/A'}</p>
                    </div>

                    {/* Specs */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-3 text-bm-terracotta">Specifications</h4>
                      {displayData?.specs?.length > 0 ? (
                        <dl className="divide-y divide-slate-100">
                          {displayData.specs.map((spec, i) => (
                            <div key={i} className="flex justify-between py-2.5 text-sm">
                              <dt className="text-slate-500 font-bold">{spec.label}</dt>
                              <dd className="text-slate-900 font-extrabold">{spec.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-sm text-slate-500 font-medium">No specifications.</p>
                      )}
                    </div>

                    {/* Variants */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest text-bm-terracotta">Variants</h4>
                        <span className="inline-flex items-center rounded-xl bg-orange-50 px-2 py-1 text-[10px] font-bold text-bm-orange ring-1 ring-orange-200/50">{displayData?.variantCount || 0} variants</span>
                      </div>
                      {displayData?.variants?.length > 0 ? (
                        <div className="space-y-3">
                          {displayData.variants.map((v, i) => (
                            <div key={i} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
                              <div className="flex justify-between font-extrabold text-slate-900 mb-3">
                                <span>{v.label} {v.size ? `(${v.size} ${v.unit || ''})` : ''}</span>
                                <span className="text-xs text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">ID: {v.id}</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="rounded-2xl px-3 py-2.5 bg-white ring-1 ring-slate-200/80">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Retail</p>
                                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">₹{v.retailPrice || 0}</p>
                                </div>
                                <div className="rounded-2xl px-3 py-2.5 bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-200/80">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-bm-terracotta">Contractor</p>
                                  <p className="mt-0.5 text-sm font-extrabold text-bm-terracotta">₹{v.contractorPrice || 0}</p>
                                </div>
                                <div className="rounded-2xl px-3 py-2.5 bg-white ring-1 ring-slate-200/80">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Bulk</p>
                                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">₹{v.bulkPrice || 0}</p>
                                </div>
                                <div className="rounded-2xl px-3 py-2.5 bg-white ring-1 ring-slate-200/80">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">MOQ</p>
                                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">{v.moq || 0}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 font-medium">No variants defined.</p>
                      )}
                    </div>

                    {/* All Images */}
                    {displayData?.images?.length > 1 && (
                      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-3 text-bm-terracotta">All Images</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {displayData.images.map((img, i) => (
                            <a href={img} target="_blank" rel="noopener noreferrer" key={i} className="aspect-square overflow-hidden rounded-2xl bg-slate-100 hover:opacity-90 transition ring-1 ring-slate-200/80">
                              <img src={img} alt="" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex justify-between items-center rounded-full bg-white/50 px-4 py-2 border border-slate-200/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Created: {new Date(displayData?.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(displayData?.updatedAt).toLocaleDateString()}</span>
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
