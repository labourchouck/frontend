import { useState, useEffect } from 'react'
import { Landmark, AlertCircle, CheckCircle2, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { adminSettingsApi } from '../../api/adminSettingsApi.js'

export function AdminCashManagementPage() {
  const [activeTab, setActiveTab] = useState('labour')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [labourLimit, setLabourLimit] = useState('')
  const [vendorLimit, setVendorLimit] = useState('')
  
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchSettings = async () => {
    try {
      const res = await adminSettingsApi.getSettings()
      const data = res.data?.settings
      if (data) {
        setSettings(data)
        setLabourLimit(data.labourCashLimit?.toString() || '500')
        setVendorLimit(data.vendorCashLimit?.toString() || '5000')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setSaving(true)
    try {
      if (activeTab === 'labour') {
        await adminSettingsApi.updateLabourCashLimit({ labourCashLimit: Number(labourLimit) })
      } else {
        await adminSettingsApi.updateVendorCashLimit({ vendorCashLimit: Number(vendorLimit) })
      }
      setSuccessMsg('Limit updated successfully!')
      fetchSettings()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setErrorMsg('Failed to update limit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cash Management</h1>
          <p className="text-sm text-slate-500 mt-1">Set maximum cash limits for Labours and Vendors</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('labour')
            setErrorMsg('')
            setSuccessMsg('')
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'labour' 
              ? 'border-brand text-brand bg-brand/5' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Labour Limits
        </button>
        <button
          onClick={() => {
            setActiveTab('vendor')
            setErrorMsg('')
            setSuccessMsg('')
          }}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'vendor' 
              ? 'border-brand text-brand bg-brand/5' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Vendor Limits
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <GlassPanel className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {activeTab === 'labour' ? 'Labour Cash Collection Limit' : 'Vendor Cash Collection Limit'}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              When a {activeTab === 'labour' ? 'Labour' : 'Vendor'} collects cash directly from the customer, the admin commission and fees are added to their Admin Dues. 
              If their total dues exceed this limit, they will be temporarily blocked from accepting new bookings until they clear their dues.
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Maximum Limit (₹)
                </label>
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Wallet className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    value={activeTab === 'labour' ? labourLimit : vendorLimit}
                    onChange={(e) => activeTab === 'labour' ? setLabourLimit(e.target.value) : setVendorLimit(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <AppPrimaryButton type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Limit'}
                </AppPrimaryButton>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  )
}
