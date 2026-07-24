import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Loader2, ImagePlus, X, Tag, PackageOpen, IndianRupee, Info, Truck, Building2, Plus, Minus, FileText, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { createVendorBuildmartProduct } from '../../../api/vendorBuildmartApi.js'
import { uploadMedia, assetUrlFromUpload } from '../../../api/uploadApi.js'

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

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
        className="flex w-full min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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

export function VendorMartProductCreatePage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    priceLabel: '',
    availability: 'in_stock',
    shortDescription: '',
    description: '',
    deliveryInfo: '',
    supplier: { name: '', rating: '', city: '' },
    specs: [],
    variants: [],
    images: [],
    relatedIds: ''
  })
  
  const [imageInput, setImageInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)
  
  const decodedCategory = decodeURIComponent(categoryId || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await createVendorBuildmartProduct({
        ...formData,
        relatedIds: formData.relatedIds ? formData.relatedIds.split(',').map(s => s.trim()).filter(Boolean) : [],
        categoryId: decodedCategory
      })
      navigate('/vendor/mart/products')
    } catch (err) {
      setError(err.message || 'Failed to submit product')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError(null)
    try {
      const res = await uploadMedia(file, 'general-media')
      const url = assetUrlFromUpload(res)
      if (url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }))
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image')
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

  return (
    <div className="fixed top-0 left-1/2 z-20 h-dvh w-full max-w-lg -translate-x-1/2 overflow-y-auto overflow-x-hidden overscroll-none bg-slate-50 pb-28 selection:bg-bm-orange/20 selection:text-bm-terracotta shadow-2xl">
      <VendorPageLayout>
        
        {/* Dynamic Header */}
        <div className="relative -mx-4 -mt-4 mb-8 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-[#7a280e] to-[#c45c26] px-4 pb-12 pt-8 shadow-xl sm:px-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
          
          <div className="relative z-10 flex items-center justify-between">
            <Link 
              to="/vendor/mart" 
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </Link>
            <div className="flex h-11 items-center rounded-full bg-white/20 px-4 backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-100">New Listing</span>
            </div>
          </div>
          
          <div className="relative z-10 mt-8">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black tracking-tight text-white shadow-sm"
            >
              Upload Product
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 flex items-center gap-2"
            >
              <span className="flex h-6 items-center rounded-md bg-white/20 px-2 text-[10px] font-bold uppercase tracking-wider text-orange-50 ring-1 ring-white/30 backdrop-blur-sm">
                {decodedCategory}
              </span>
            </motion.div>
          </div>
        </div>

        <section className="-mt-12 px-4 sm:px-6">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Details */}
              <motion.div variants={itemVariant} className="relative z-50">
                <GlassPanel className="p-5 sm:p-6 !overflow-visible">
                  <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Product Details</h2>
                  <div className="space-y-4">
                    
                    <div className="group">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                        <PackageOpen className="h-3.5 w-3.5" /> Product Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                        placeholder="e.g. UltraTech Cement 50kg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                          <Tag className="h-3.5 w-3.5" /> Brand
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.brand}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          placeholder="e.g. UltraTech"
                        />
                      </div>

                      <div className="group">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                          <IndianRupee className="h-3.5 w-3.5" /> Price Label
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.priceLabel}
                          onChange={(e) => setFormData(prev => ({ ...prev, priceLabel: e.target.value }))}
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                          placeholder="e.g. ₹450 / bag"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
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
                </GlassPanel>
              </motion.div>

              {/* Extended Details */}
              <motion.div variants={itemVariant}>
                <GlassPanel className="p-5 sm:p-6">
                  <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-800">Descriptions</h2>
                  <div className="space-y-4">
                    
                    <div className="group">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                        <FileText className="h-3.5 w-3.5" /> Short Description
                      </label>
                      <textarea
                        rows={2}
                        value={formData.shortDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        className="w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                        placeholder="Brief summary..."
                      />
                    </div>

                    <div className="group">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                        <FileText className="h-3.5 w-3.5" /> Full Description
                      </label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                        placeholder="Detailed product information..."
                      />
                    </div>

                    <div className="group">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-bm-orange">
                        <Truck className="h-3.5 w-3.5" /> Delivery Info
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryInfo: e.target.value }))}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                        placeholder="e.g. Delivery in 2-3 business days"
                      />
                    </div>

                  </div>
                </GlassPanel>
              </motion.div>



              {/* Specifications */}
              <motion.div variants={itemVariant}>
                <GlassPanel className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Specifications</h2>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      <Plus className="h-3 w-3" /> Add Spec
                    </button>
                  </div>
                  
                  {formData.specs.length === 0 ? (
                    <p className="text-xs text-slate-400">No specifications added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.specs.map((spec, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Label (e.g. Weight)"
                            value={spec.label}
                            onChange={e => handleSpecChange(i, 'label', e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none transition focus:border-bm-orange focus:bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 50kg)"
                            value={spec.value}
                            onChange={e => handleSpecChange(i, 'value', e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none transition focus:border-bm-orange focus:bg-white"
                          />
                          <button type="button" onClick={() => handleRemoveSpec(i)} className="p-2 text-slate-400 hover:text-red-500 shrink-0">
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassPanel>
              </motion.div>

              {/* Variants */}
              <motion.div variants={itemVariant}>
                <GlassPanel className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Variants</h2>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      <Plus className="h-3 w-3" /> Add Variant
                    </button>
                  </div>
                  
                  {formData.variants.length === 0 ? (
                    <p className="text-xs text-slate-400">No variants added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {formData.variants.map((v, i) => (
                        <div key={i} className="relative rounded-xl border border-slate-100 bg-slate-50/50 p-4">
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
                  )}
                </GlassPanel>
              </motion.div>

              {/* Images Section */}
              <motion.div variants={itemVariant}>
                <GlassPanel className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Media</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {formData.images.length} added
                    </span>
                  </div>
                  
                  <div className="group relative flex gap-2">
                    <input
                      type="url"
                      value={imageInput}
                      onChange={(e) => setImageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                      className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-100 focus:border-bm-orange focus:bg-white focus:ring-4 focus:ring-bm-orange/10"
                      placeholder="Paste image URL and press Enter..."
                    />
                    <ImagePlus className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-bm-orange" />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      disabled={!imageInput.trim()}
                      className="flex shrink-0 items-center justify-center rounded-xl bg-slate-800 px-5 text-sm font-bold text-white transition hover:bg-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center">
                    <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-4 transition hover:border-bm-orange hover:bg-bm-orange/5">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-bm-orange" />
                          <span className="text-sm font-semibold text-slate-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-slate-400 group-hover:text-bm-orange" />
                          <span className="text-sm font-semibold text-slate-600 group-hover:text-bm-orange">Or click to upload from device</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <motion.div layout className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      <AnimatePresence>
                        {formData.images.map((img, i) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            key={`${img}-${i}`} 
                            className="group relative aspect-square overflow-hidden rounded-xl border-2 border-slate-100 bg-slate-50 shadow-sm transition hover:border-bm-orange"
                          >
                            <img src={img} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-red-50 hover:text-red-600 active:scale-90 opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </GlassPanel>
              </motion.div>

              <motion.div variants={itemVariant} className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7a280e] to-[#c45c26] py-4 font-black text-white shadow-[0_8px_30px_rgb(196,92,38,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(196,92,38,0.5)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                >
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] transition-transform duration-1000 ease-out group-hover:translate-x-[150%]">
                    <div className="relative h-full w-12 bg-white/20" />
                  </div>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                      <span>Submit for Approval</span>
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-[11px] font-semibold text-slate-500">
                  Your product will be reviewed by an administrator before it goes live.
                </p>
              </motion.div>

            </form>
          </motion.div>
        </section>
      </VendorPageLayout>
    </div>
  )
}
