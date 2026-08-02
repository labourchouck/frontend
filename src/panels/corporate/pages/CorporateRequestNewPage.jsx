import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, MapPin } from 'lucide-react'
import { apiRequest } from '../../../api/http.js'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { AppSearchableSelect } from '../../../components/app-ui/inputs/AppSearchableSelect.jsx'
import {
  useCreateRequestMutation,
  useGetCorporateProjectsQuery,
  useSearchVendorsMutation,
} from '../../../store/api/workforceApi.js'
import { CorporateRequestCheckout } from '../components/CorporateRequestCheckout.jsx'
import { CorporateRequestLabourSelection } from '../components/CorporateRequestLabourSelection.jsx'

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'long_term', label: 'Long term' },
]

function emptyLine() {
  return { categoryId: '', serviceId: '', quantity: 1 }
}

export function CorporateRequestNewPage() {
  const navigate = useNavigate()
  const { data: projectsData } = useGetCorporateProjectsQuery()
  const [createRequest, { isLoading }] = useCreateRequestMutation()
  const projects = projectsData?.projects ?? []

  const [projectName, setProjectName] = useState('')
  const [scheduleType, setScheduleType] = useState('daily')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [shiftStart, setShiftStart] = useState('08:00')
  const [shiftEnd, setShiftEnd] = useState('18:00')
  const [locationText, setLocationText] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [platformFeeConfig, setPlatformFeeConfig] = useState(null)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const locationInputRef = useRef(null)
  
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const initAutocomplete = () => {
      if (!locationInputRef.current) return
      if (!window.google?.maps?.places?.Autocomplete) return
      
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        fields: ['formatted_address', 'geometry'],
      })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          setLatitude(lat)
          setLongitude(lng)
          if (place.formatted_address) {
            setLocationText(place.formatted_address)
          }
        }
      })
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete()
      return
    }

    const existingScript = document.getElementById('google-maps-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.head.appendChild(script)
    } else {
      existingScript.addEventListener('load', initAutocomplete)
    }
  }, [])

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    
    setIsFetchingLocation(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        setLatitude(lat)
        setLongitude(lng)
        
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
          if (!apiKey) {
            setLocationText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
            setIsFetchingLocation(false)
            return
          }
          
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
          const data = await res.json()
          
          if (data.results && data.results.length > 0) {
            setLocationText(data.results[0].formatted_address)
          } else {
            setLocationText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          }
        } catch (err) {
          setLocationText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
        setIsFetchingLocation(false)
      },
      (err) => {
        setError('Could not fetch location. Please allow location permissions.')
        setIsFetchingLocation(false)
      }
    )
  }

  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([emptyLine()])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedVendorId, setSelectedVendorId] = useState(null)
  const [selectedCrew, setSelectedCrew] = useState([])
  const [step, setStep] = useState(1)
  
  const [searchVendors, { isLoading: isSearching }] = useSearchVendorsMutation()

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const json = await apiRequest('/labour-categories/grouped')
          if (cancelled) return
          const payload = json?.data ?? json
          setCategories(payload?.groups ?? [])
        } catch {
          if (!cancelled) setCategories([])
        }
      })()
    return () => {
      cancelled = true
    }
  }, [])

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSearchResults(null)
    setSelectedVendorId(null)
    const validLines = lines.filter((l) => l.categoryId)
    if (!validLines.length) {
      setError('Add at least one skill line')
      return
    }
    if (!startDate || !endDate) {
      setError('Please select both start date and end date to estimate pricing')
      return
    }

    try {
      const res = await searchVendors({
        lines: validLines.map((l) => ({
          categoryId: l.categoryId,
          serviceId: l.serviceId || undefined,
          quantity: Number(l.quantity) || 1,
        })),
        startDate,
        endDate,
        ...(latitude && longitude ? { lat: latitude, lng: longitude } : {}),
      }).unwrap()
      setSearchResults(res.vendors || [])
      setPlatformFeeConfig(res.platformFeeConfig || null)
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not search vendors')
    }
  }

  const handleFinalSubmit = async () => {
    setError('')
    const validLines = lines.filter((l) => l.categoryId)
    if (!startDate) {
      setError('Start date is required')
      return
    }
    try {
      await createRequest({
        projectName: projectName.trim() || undefined,
        scheduleType,
        startDate,
        endDate: endDate || undefined,
        shiftStart,
        shiftEnd,
        locationText: locationText.trim() || undefined,
        ...(latitude && longitude ? { lat: latitude, lng: longitude } : {}),
        notes: notes.trim() || undefined,
        preferredVendorId: selectedVendorId || undefined,
        selectedCrewIds: selectedCrew.map(c => c._id),
        lines: validLines.map((l) => ({
          categoryId: l.categoryId,
          serviceId: l.serviceId || undefined,
          quantity: Number(l.quantity) || 1,
        })),
      }).unwrap()
      navigate('/corporate/requests')
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not create request')
    }
  }

  if (step === 2 && selectedVendorId) {
    const selectedVendor = searchResults?.find(v => v._id === selectedVendorId)
    return (
      <div className="space-y-4 pb-8">
        <Link to="/corporate/requests" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to requests
        </Link>
        <CorporateRequestLabourSelection 
          vendor={selectedVendor} 
          requestedLines={lines.filter((l) => l.categoryId)}
          onBack={() => setStep(1)} 
          onProceed={(crew) => {
            setSelectedCrew(crew)
            setStep(3)
          }} 
        />
      </div>
    )
  }

  if (step === 3 && selectedVendorId) {
    const selectedVendor = searchResults?.find(v => v._id === selectedVendorId)
    return (
      <div className="space-y-4 pb-8">
        <Link to="/corporate/requests" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to requests
        </Link>
        <CorporateRequestCheckout 
          vendor={selectedVendor} 
          selectedCrew={selectedCrew}
          platformFeeConfig={platformFeeConfig}
          onBack={() => setStep(2)} 
          onSubmit={handleFinalSubmit} 
          isSubmitting={isLoading} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <Link to="/corporate/requests" className="inline-flex items-center gap-2 text-sm font-bold text-brand">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to requests
      </Link>

      <AppSurface>
        <h2 className="text-lg font-extrabold text-slate-900">New workforce request</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Project
            </label>
            <input 
              type="text"
              className={inputClass} 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name (optional)"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Skill lines</label>
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
                Add More
              </button>
            </div>
            <ul className="space-y-4">
              {lines.map((line, idx) => {
                const categoryOptions = []
                categories.forEach(group => {
                  (group.categories || []).forEach(cat => {
                    categoryOptions.push({
                      value: cat._id || cat.id,
                      label: `${group.name} — ${cat.name}`
                    })
                  })
                })

                let availableServices = []
                let selectedCategory = null
                
                for (const group of categories) {
                  const cat = (group.categories || []).find(c => c._id === line.categoryId || c.id === line.categoryId)
                  if (cat) {
                    selectedCategory = cat
                    break
                  }
                }
                
                if (selectedCategory) {
                  availableServices = selectedCategory.services || []
                }

                return (
                  <li key={idx} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Category</label>
                      <AppSearchableSelect
                        value={line.categoryId}
                        onChange={(val) => updateLine(idx, { categoryId: val, serviceId: '' })}
                        options={categoryOptions}
                        placeholder="Select category"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Service</label>
                      <AppSearchableSelect
                        value={line.serviceId}
                        onChange={(val) => updateLine(idx, { serviceId: val })}
                        options={availableServices.map(s => ({ value: s._id, label: s.name }))}
                        placeholder={line.categoryId ? 'Select service (optional)' : 'Select category first'}
                        disabled={!line.categoryId}
                      />
                    </div>
                    <div className="w-full sm:w-24 shrink-0">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Count</label>
                      <input
                        type="number"
                        min={1}
                        className={`${inputClass}`}
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                      />
                    </div>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 mb-[2px]"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Schedule
            </label>
            <AppSearchableSelect
              value={scheduleType}
              onChange={setScheduleType}
              options={SCHEDULE_OPTIONS}
              hideSearch={true}
              placeholder="Select schedule"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Start date
              </label>
              <input
                type="date"
                className={inputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                End date
              </label>
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Shift start
              </label>
              <input
                type="time"
                className={inputClass}
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Shift end
              </label>
              <input
                type="time"
                className={inputClass}
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Location
              </label>
              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={isFetchingLocation}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand/80 disabled:opacity-50"
              >
                <MapPin className="h-3 w-3" />
                {isFetchingLocation ? 'Fetching...' : 'Fetch Location'}
              </button>
            </div>
            <input 
              ref={locationInputRef}
              className={inputClass} 
              value={locationText} 
              onChange={(e) => setLocationText(e.target.value)} 
              placeholder="Enter location or fetch automatically"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Notes</label>
            <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

          <AppPrimaryButton type="submit" className="w-full" loading={isSearching}>
            Search Vendors
          </AppPrimaryButton>
        </form>

        {searchResults !== null && (
          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="mb-4 text-lg font-bold text-slate-800">
              Matching Vendors ({searchResults.length})
            </h3>
            
            {searchResults.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No vendors found matching all your requirements. Try adjusting your skill lines.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((vendor) => (
                  <div 
                    key={vendor._id} 
                    onClick={() => setSelectedVendorId(vendor._id)}
                    className={`flex items-center justify-between rounded-xl border p-4 shadow-sm cursor-pointer transition-colors ${
                      selectedVendorId === vendor._id 
                        ? 'border-brand bg-brand/5 ring-1 ring-brand' 
                        : 'border-slate-200 bg-white hover:border-brand/30'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-800">{vendor.businessName}</h4>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500">
                        <span>{vendor.fullName}</span>
                        <span>⭐ {vendor.rating?.toFixed(1) || '0.0'}</span>
                        {vendor.distance !== undefined && (
                          <span>{vendor.distance.toFixed(1)} km away</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand">{vendor.availableCrewSize || vendor.matchingCrewSize || 0} matching crew</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedVendorId && (
              <div className="mt-8">
                <AppPrimaryButton 
                  type="button" 
                  className="w-full bg-slate-800 hover:bg-slate-900" 
                  onClick={() => setStep(2)}
                >
                  Next Step
                </AppPrimaryButton>
              </div>
            )}
          </div>
        )}
      </AppSurface>
    </div>
  )
}
