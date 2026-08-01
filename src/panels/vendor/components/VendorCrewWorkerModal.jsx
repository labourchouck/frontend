import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { vendorApi } from '../../../api/vendorApi.js'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

export function VendorCrewWorkerModal({ isOpen, onClose, workerId, mode: initialMode, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState(initialMode || 'view')
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    category: '',
    status: 'active'
  })
  const [services, setServices] = useState([])

  useEffect(() => {
    if (isOpen && workerId) {
      setMode(initialMode || 'view')
      loadWorker()
    }
  }, [isOpen, workerId, initialMode])

  const loadWorker = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await vendorApi.getCrewLabourById(workerId)
      const data = res?.data?.crewLabour
      if (data) {
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          category: data.category || '',
          status: data.status || 'active'
        })
        setServices(data.services?.length ? data.services : [{ name: '', price: '' }])
      }
    } catch (err) {
      setError('Could not load worker details.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleServiceChange = (index, field, value) => {
    const updated = [...services]
    updated[index][field] = value
    setServices(updated)
  }

  const addService = () => setServices(prev => [...prev, { name: '', price: '' }])
  const removeService = (index) => setServices(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mode === 'view') {
      onClose()
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...formData,
        services: services.filter(s => s.name.trim() !== '').map(s => ({
          name: s.name.trim(),
          price: Number(s.price) || 0
        }))
      }
      // Using PUT as requested
      await vendorApi.updateCrewLabour(workerId, payload)
      onUpdated()
      onClose()
    } catch (err) {
      setError(err?.data?.message || 'Failed to update worker.')
    } finally {
      setSaving(false)
    }
  }

  const isReadOnly = mode === 'view'

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-md max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white/80 px-5 py-4 backdrop-blur-md">
            <h2 className="text-lg font-extrabold text-slate-900">
              {mode === 'view' ? 'Worker Profile' : 'Edit Worker'}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-6">
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading details...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className={inputClass}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Mobile Number</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.phone}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Address</label>
                  <textarea
                    name="address"
                    className={inputClass}
                    value={formData.address}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                    rows={2}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">City</label>
                    <input
                      type="text"
                      name="city"
                      className={inputClass}
                      value={formData.city}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">State</label>
                    <input
                      type="text"
                      name="state"
                      className={inputClass}
                      value={formData.state}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Category</label>
                  <input
                    type="text"
                    name="category"
                    className={inputClass}
                    value={formData.category}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[11px] font-bold uppercase text-slate-500">Services & Pricing</label>
                    {!isReadOnly && (
                      <button 
                        type="button" 
                        onClick={addService}
                        className="text-xs font-bold text-brand flex items-center gap-1 bg-brand/10 px-2 py-1 rounded-lg hover:bg-brand/20 transition"
                      >
                        <Plus className="h-3 w-3" /> Add Service
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Service name"
                            value={service.name}
                            onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </div>
                        <div className="w-1/3">
                          <input
                            type="number"
                            className={inputClass}
                            placeholder="Price"
                            value={service.price}
                            onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </div>
                        {!isReadOnly && services.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeService(index)}
                            className="mt-2 p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isReadOnly && services.length === 0 && (
                      <p className="text-sm text-slate-400 italic">No services listed.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Status</label>
                  <select
                    name="status"
                    className={inputClass}
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
              </form>
            )}
          </div>
          
          <div className="shrink-0 border-t border-slate-100 bg-white p-4 pb-safe flex gap-3">
            {mode === 'edit' ? (
              <>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-1/3 rounded-2xl py-3.5 text-[15px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <AppPrimaryButton type="submit" className="w-2/3" loading={saving} onClick={handleSubmit}>
                  Save Edit
                </AppPrimaryButton>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="w-1/3 rounded-2xl py-3.5 text-[15px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Close
                </button>
                <AppPrimaryButton type="button" className="w-2/3" onClick={() => setMode('edit')}>
                  Edit Profile
                </AppPrimaryButton>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
