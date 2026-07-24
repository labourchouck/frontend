import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ImagePlus, Upload, Plus, Minus, Tag, PackageOpen, IndianRupee, Info, FileText, Truck, Check } from 'lucide-react'
import { updateVendorBuildmartProduct, getVendorBuildmartProductById } from '../../../api/vendorBuildmartApi.js'
import { uploadMedia, assetUrlFromUpload } from '../../../api/uploadApi.js'

const Backdrop = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm"
  />
)

function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value === value)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-50 focus:border-bm-orange focus:ring-4 focus:ring-bm-orange/10"
      >
        <span>{selectedOption?.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    value === option.value
                      ? 'bg-bm-orange/10 text-bm-terracotta'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                  {value === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function VendorMartProductEditModal({ isOpen, onClose, product, onSuccess }) {
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)
  const [imageInput, setImageInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      setFetching(true)
      getVendorBuildmartProductById(product.id || product._id)
        .then(res => {
          const data = res?.data || res
          setFormData({
            name: data.name || '',
            brand: data.brand || '',
            priceLabel: data.priceLabel || '',
            availability: data.availability || 'in_stock',
            shortDescription: data.shortDescription || '',
            description: data.description || '',
            deliveryInfo: data.deliveryInfo || '',
            specs: data.specs || [],
            variants: data.variants || [],
            images: data.images || [],
            relatedIds: data.relatedIds ? data.relatedIds.join(', ') : ''
          })
        })
        .catch(err => {
          setError('Failed to load product details')
          console.error(err)
        })
        .finally(() => setFetching(false))
    }
  }, [isOpen, product])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const res = await updateVendorBuildmartProduct(product.id || product._id, {
        ...formData,
        relatedIds: formData.relatedIds ? formData.relatedIds.split(',').map(s => s.trim()).filter(Boolean) : []
      })
      onSuccess(res?.data || res)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const res = await uploadMedia(file, 'general-media')
      const url = assetUrlFromUpload(res)
      if (url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageInput.trim()] }))
      setImageInput('')
    }
  }
  
  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleAddSpec = () => {
    setFormData(prev => ({ ...prev, specs: [...prev.specs, { label: '', value: '' }] }))
  }
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specs]
    newSpecs[index][field] = value
    setFormData(prev => ({ ...prev, specs: newSpecs }))
  }
  const handleRemoveSpec = (index) => {
    const newSpecs = formData.specs.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, specs: newSpecs }))
  }

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: '', label: '', size: '', unit: '', retailPrice: '', contractorPrice: '', bulkPrice: '', moq: '' }]
    }))
  }
  const handleVariantChange = (index, field, value) => {
    const newVars = [...formData.variants]
    newVars[index][field] = value
    setFormData(prev => ({ ...prev, variants: newVars }))
  }
  const handleRemoveVariant = (index) => {
    const newVars = formData.variants.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, variants: newVars }))
  }

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
                <h2 className="text-lg font-black text-slate-900">Edit Product</h2>
                <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {fetching ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-bm-terracotta" />
                  </div>
                ) : formData ? (
                  <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                      </div>
                    )}
                    
                    {/* Basic Details */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Basic Info</h3>
                      <div className="space-y-4">
                        <div className="group">
                          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <PackageOpen className="h-3.5 w-3.5" /> Product Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold outline-none focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="group">
                            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              <Tag className="h-3.5 w-3.5" /> Brand
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.brand}
                              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold outline-none focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                            />
                          </div>
                          <div className="group">
                            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              <IndianRupee className="h-3.5 w-3.5" /> Price Label
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.priceLabel}
                              onChange={(e) => setFormData(prev => ({ ...prev, priceLabel: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold outline-none focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <Info className="h-3.5 w-3.5" /> Availability
                          </label>
                          <CustomSelect
                            value={formData.availability}
                            onChange={(val) => setFormData(prev => ({ ...prev, availability: val }))}
                            options={[
                              { value: 'in_stock', label: 'In Stock' },
                              { value: 'limited', label: 'Limited Stock' },
                              { value: 'preorder', label: 'Pre Order' }
                            ]}
                          />
                        </div>

                        <div className="group">
                          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                            <PackageOpen className="h-3.5 w-3.5" /> Related Product IDs
                          </label>
                          <input
                            type="text"
                            value={formData.relatedIds}
                            onChange={(e) => setFormData(prev => ({ ...prev, relatedIds: e.target.value }))}
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                            placeholder="e.g. pvc-20mm, pvc-25mm (comma separated)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Descriptions</h3>
                      <div className="space-y-4">
                        <div className="group">
                          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <FileText className="h-3.5 w-3.5" /> Short Description
                          </label>
                          <textarea
                            rows={2}
                            value={formData.shortDescription}
                            onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          />
                        </div>
                        <div className="group">
                          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <FileText className="h-3.5 w-3.5" /> Full Description
                          </label>
                          <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          />
                        </div>
                        <div className="group">
                          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <Truck className="h-3.5 w-3.5" /> Delivery Info
                          </label>
                          <input
                            type="text"
                            value={formData.deliveryInfo}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryInfo: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Specifications</h3>
                        <button type="button" onClick={handleAddSpec} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
                          <Plus className="h-3 w-3" /> Add Spec
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.specs.map((spec, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Label"
                              value={spec.label}
                              onChange={e => handleSpecChange(i, 'label', e.target.value)}
                              className="w-1/3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-bm-orange focus:bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Value"
                              value={spec.value}
                              onChange={e => handleSpecChange(i, 'value', e.target.value)}
                              className="w-2/3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-bm-orange focus:bg-white"
                            />
                            <button type="button" onClick={() => handleRemoveSpec(i)} className="p-2 text-slate-400 hover:text-red-500">
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Variants */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Variants</h3>
                        <button type="button" onClick={handleAddVariant} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
                          <Plus className="h-3 w-3" /> Add Variant
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.variants.map((v, i) => (
                          <div key={i} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <button type="button" onClick={() => handleRemoveVariant(i)} className="absolute right-3 top-3 text-slate-400 hover:text-red-500">
                              <X className="h-4 w-4" />
                            </button>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pr-6">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">ID (Slug)</label>
                                <input type="text" placeholder="e.g. pvc-20mm" value={v.id} onChange={e => handleVariantChange(i, 'id', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Label</label>
                                <input type="text" placeholder="e.g. 20mm" value={v.label} onChange={e => handleVariantChange(i, 'label', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Size</label>
                                <input type="text" placeholder="e.g. 20" value={v.size} onChange={e => handleVariantChange(i, 'size', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit</label>
                                <input type="text" placeholder="e.g. mm" value={v.unit} onChange={e => handleVariantChange(i, 'unit', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Retail Price (₹)</label>
                                <input type="number" placeholder="0" value={v.retailPrice} onChange={e => handleVariantChange(i, 'retailPrice', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Contractor Price (₹)</label>
                                <input type="number" placeholder="0" value={v.contractorPrice} onChange={e => handleVariantChange(i, 'contractorPrice', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Bulk Price (₹)</label>
                                <input type="number" placeholder="0" value={v.bulkPrice} onChange={e => handleVariantChange(i, 'bulkPrice', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">MOQ</label>
                                <input type="number" placeholder="0" value={v.moq} onChange={e => handleVariantChange(i, 'moq', e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-bm-orange focus:ring-2 focus:ring-bm-orange/10" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Images */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Media</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{formData.images.length} added</span>
                      </div>
                      
                      <div className="group relative flex gap-2 mb-4">
                        <input
                          type="url"
                          value={imageInput}
                          onChange={(e) => setImageInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          placeholder="Paste image URL..."
                        />
                        <ImagePlus className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-bm-orange" />
                        <button
                          type="button"
                          onClick={handleAddImage}
                          disabled={!imageInput.trim()}
                          className="flex shrink-0 items-center justify-center rounded-xl bg-slate-800 px-5 text-sm font-bold text-white disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3">
                        {formData.images.map((img, i) => (
                          <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <img src={img} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 transition-opacity group-hover:opacity-100" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-bm-orange group">
                          {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin text-bm-orange" /> : <Upload className="h-5 w-5 text-slate-400 group-hover:text-bm-orange" />}
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploadingImage} />
                        </label>
                      </div>
                    </div>
                  </form>
                ) : null}
              </div>
              
              <div className="shrink-0 border-t border-slate-100 bg-white p-4">
                <button
                  type="submit"
                  form="edit-product-form"
                  disabled={loading || fetching}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7a280e] to-[#c45c26] py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Resubmit'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
