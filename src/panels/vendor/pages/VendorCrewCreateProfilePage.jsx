import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSearchableSelect } from '../../../components/app-ui/inputs/AppSearchableSelect.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { vendorApi } from '../../../api/vendorApi.js'

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

import { INDIAN_CITIES } from '../../../constants/vendorVerification.js'
import { fetchLabourCategoriesGrouped } from '../../../api/labourCategoriesApi.js'
import { useEffect, useMemo } from 'react'
export function VendorCrewCreateProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get phone from state or fallback
  const initialPhone = location.state?.phone || ''

  const [formData, setFormData] = useState({
    fullName: '',
    phone: initialPhone,
    address: '',
    city: '',
    state: '',
    category: '',
    status: 'active'
  })
  
  const [services, setServices] = useState([
    { name: '', price: '' }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [adminCategories, setAdminCategories] = useState([])
  const [fetchingCategories, setFetchingCategories] = useState(false)

  useEffect(() => {
    setFetchingCategories(true)
    fetchLabourCategoriesGrouped()
      .then(res => {
        setAdminCategories(res.data?.groups || [])
      })
      .catch(err => {
        console.error('Failed to fetch categories', err)
      })
      .finally(() => {
        setFetchingCategories(false)
      })
  }, [])

  const availableServices = useMemo(() => {
    if (!formData.category || !adminCategories.length) return []
    for (const group of adminCategories) {
      const cat = group.categories?.find(c => c.name === formData.category)
      if (cat) return cat.services || []
    }
    return []
  }, [formData.category, adminCategories])

  const categoryOptions = useMemo(() => {
    const opts = []
    adminCategories.forEach(group => {
      (group.categories || []).forEach(cat => {
        opts.push({
          value: cat.name,
          label: `${group.name} — ${cat.name}`
        })
      })
    })
    return opts
  }, [adminCategories])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'city') {
      let newState = formData.state
      const matchedCity = INDIAN_CITIES.find(c => c.city.toLowerCase() === value.toLowerCase())
      if (matchedCity) {
        newState = matchedCity.state
      }
      setFormData(prev => ({ ...prev, city: value, state: newState }))
    } else if (name === 'category') {
      setFormData(prev => ({ ...prev, category: value }))
      setServices([{ name: '', price: '' }]) // Reset services when category changes
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services]
    updatedServices[index][field] = value
    setServices(updatedServices)
  }

  const addService = () => {
    setServices(prev => [...prev, { name: '', price: '' }])
  }

  const removeService = (index) => {
    setServices(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Full Name and Phone are required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        services: services.filter(s => s.name.trim() !== '').map(s => ({
          name: s.name.trim(),
          price: Number(s.price) || 0
        }))
      }

      await vendorApi.createCrewLabour(payload)
      navigate('/vendor/crew')
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <VendorPageLayout>
      <Link to="/vendor/crew" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
        <ArrowLeft className="h-4 w-4" />
        Crew
      </Link>
      
      <VendorCard>
        <h2 className="text-lg font-extrabold text-slate-900">Create Labour Profile</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 mb-6">
          Add details for your new crew member.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Full Name *</label>
            <input
              type="text"
              name="fullName"
              className={inputClass}
              placeholder="e.g. Rahul Kumar"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Mobile Number *</label>
            <input
              type="tel"
              name="phone"
              className={inputClass}
              placeholder="10-digit phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              readOnly={!!initialPhone}
            />
            {initialPhone && <p className="text-xs text-slate-400 mt-1">Verified mobile number cannot be changed.</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Address</label>
            <textarea
              name="address"
              className={inputClass}
              placeholder="Full address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">City</label>
              <input
                type="text"
                name="city"
                autoComplete="off"
                className={inputClass}
                placeholder="e.g. Indore"
                value={formData.city}
                onFocus={() => setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                onChange={handleInputChange}
              />
              {showCitySuggestions && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 custom-scrollbar">
                  {INDIAN_CITIES.filter(c => c.city.toLowerCase().includes(formData.city.toLowerCase())).length > 0 ? (
                    INDIAN_CITIES.filter(c => c.city.toLowerCase().includes(formData.city.toLowerCase())).map((c, i) => (
                      <li
                        key={i}
                        className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setFormData(prev => ({ ...prev, city: c.city, state: c.state }))
                          setShowCitySuggestions(false)
                        }}
                      >
                        {c.city}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-slate-400">No matching cities found.</li>
                  )}
                </ul>
              )}
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">State</label>
              <input
                type="text"
                name="state"
                className={inputClass}
                placeholder="e.g. MP"
                value={formData.state}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Category *</label>
            {fetchingCategories ? (
               <div className={`${inputClass} flex items-center text-slate-400`}>Loading...</div>
            ) : (
               <AppSearchableSelect
                 value={formData.category}
                 onChange={(val) => {
                   setFormData(prev => ({ ...prev, category: val }))
                   setServices([{ name: '', price: '' }]) // Reset services
                 }}
                 options={categoryOptions}
                 placeholder="Select Category"
               />
            )}
          </div>
          
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[11px] font-bold uppercase text-slate-500">Services & Pricing</label>
              <button 
                type="button" 
                onClick={addService}
                className="text-xs font-bold text-brand flex items-center gap-1 bg-brand/10 px-2 py-1 rounded-lg"
              >
                <Plus className="h-3 w-3" /> Add Service
              </button>
            </div>
            
            <div className="space-y-3">
              {services.map((service, index) => {
                const serviceOpts = availableServices.map(s => ({ value: s.name, label: s.name }))
                return (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <AppSearchableSelect
                        value={service.name}
                        onChange={(val) => handleServiceChange(index, 'name', val)}
                        options={serviceOpts}
                        placeholder={formData.category ? 'Select Service' : 'Select Category First'}
                        disabled={!formData.category}
                      />
                    </div>
                    <div className="w-1/3">
                      <input
                        type="number"
                        className={inputClass}
                        placeholder="Price (₹)"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                        required
                        min="0"
                      />
                    </div>
                  {services.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeService(index)}
                      className="mt-2 p-2 text-rose-500 bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Status</label>
            <select
              name="status"
              className={inputClass}
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          
          <div className="pt-4">
            <AppPrimaryButton type="submit" className="w-full" loading={loading}>
              Send Request
            </AppPrimaryButton>
          </div>
        </form>
      </VendorCard>
    </VendorPageLayout>
  )
}
