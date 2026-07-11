import { useState, useEffect } from 'react'
import { Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { adminSettingsApi } from '../../api/adminSettingsApi.js'

export function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Loading states for individual saves
  const [savingComm, setSavingComm] = useState(false)
  const [savingPlatform, setSavingPlatform] = useState(false)
  const [savingWallet, setSavingWallet] = useState(false)
  const [savingGst, setSavingGst] = useState(false)
  const [savingPenalty, setSavingPenalty] = useState(false)

  // Feedback messages
  const [messages, setMessages] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await adminSettingsApi.getSettings()
      setSettings(res.data?.settings || {})
      setError('')
    } catch (err) {
      setError('Failed to load system settings')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (key, type, text) => {
    setMessages(prev => ({ ...prev, [key]: { type, text } }))
    setTimeout(() => {
      setMessages(prev => ({ ...prev, [key]: null }))
    }, 5000)
  }

  const handleUpdateCommission = async (e) => {
    e.preventDefault()
    setSavingComm(true)
    try {
      await adminSettingsApi.updateCommission(settings.commission)
      showMessage('commission', 'success', 'Commission updated successfully')
    } catch (err) {
      showMessage('commission', 'error', err.response?.data?.message || 'Failed to update commission')
    } finally {
      setSavingComm(false)
    }
  }

  const handleUpdatePlatformFee = async (e) => {
    e.preventDefault()
    setSavingPlatform(true)
    try {
      await adminSettingsApi.updatePlatformFees(settings.platformFee)
      showMessage('platform', 'success', 'Platform fees updated successfully')
    } catch (err) {
      showMessage('platform', 'error', err.response?.data?.message || 'Failed to update platform fees')
    } finally {
      setSavingPlatform(false)
    }
  }

  const handleUpdateWalletLimit = async (e) => {
    e.preventDefault()
    setSavingWallet(true)
    try {
      await adminSettingsApi.updateWalletLimit({ walletLimit: settings.walletLimit })
      showMessage('wallet', 'success', 'Wallet limit updated successfully')
    } catch (err) {
      showMessage('wallet', 'error', err.response?.data?.message || 'Failed to update wallet limit')
    } finally {
      setSavingWallet(false)
    }
  }

  const handleUpdateGst = async (e) => {
    e.preventDefault()
    setSavingGst(true)
    try {
      await adminSettingsApi.updateGstPercentage({ gstPercentage: settings.gstPercentage })
      showMessage('gst', 'success', 'GST updated successfully')
    } catch (err) {
      showMessage('gst', 'error', err.response?.data?.message || 'Failed to update GST')
    } finally {
      setSavingGst(false)
    }
  }

  const handleUpdatePenalty = async (e) => {
    e.preventDefault()
    setSavingPenalty(true)
    try {
      await adminSettingsApi.updateCancellationPenalty({ cancellationPenalty: settings.cancellationPenalty })
      showMessage('penalty', 'success', 'Cancellation penalty updated successfully')
    } catch (err) {
      showMessage('penalty', 'error', err.response?.data?.message || 'Failed to update cancellation penalty')
    } finally {
      setSavingPenalty(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button onClick={loadSettings} className="mt-4 px-4 py-2 bg-brand text-white rounded-lg">Retry</button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 mt-1">Manage global platform configurations, fees, and rules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Commission Settings */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand" />
            Global Commission
          </h2>
          
          {messages.commission && (
            <div className={`p-3 rounded-lg mb-4 text-sm flex items-start gap-2 ${messages.commission.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {messages.commission.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {messages.commission.text}
            </div>
          )}

          <form onSubmit={handleUpdateCommission} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
              <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600">
                Percentage (%)
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Global Value</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                required
                value={settings.commission?.globalPercentage ?? ''}
                onChange={(e) => setSettings({...settings, commission: {...settings.commission, globalPercentage: parseFloat(e.target.value), type: 'PERCENTAGE'}})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="commActive"
                checked={settings.commission?.isActive ?? true}
                onChange={(e) => setSettings({...settings, commission: {...settings.commission, isActive: e.target.checked}})}
                className="w-4 h-4 text-brand rounded focus:ring-brand"
              />
              <label htmlFor="commActive" className="text-sm font-medium text-gray-700">Is Active</label>
            </div>
            
            <AppPrimaryButton type="submit" disabled={savingComm} className="w-full justify-center">
              {savingComm ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Commission'}
            </AppPrimaryButton>
          </form>
        </GlassPanel>

        {/* Platform Fees Settings */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand" />
            Platform Fees (Customer)
          </h2>
          
          {messages.platform && (
            <div className={`p-3 rounded-lg mb-4 text-sm flex items-start gap-2 ${messages.platform.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {messages.platform.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {messages.platform.text}
            </div>
          )}

          <form onSubmit={handleUpdatePlatformFee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
              <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600">
                Fixed Amount (₹)
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Value</label>
              <input 
                type="number"
                min="0"
                step="1"
                required
                value={settings.platformFee?.value ?? ''}
                onChange={(e) => setSettings({...settings, platformFee: {...settings.platformFee, value: parseFloat(e.target.value), type: 'FIXED'}})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="platActive"
                checked={settings.platformFee?.isActive ?? true}
                onChange={(e) => setSettings({...settings, platformFee: {...settings.platformFee, isActive: e.target.checked}})}
                className="w-4 h-4 text-brand rounded focus:ring-brand"
              />
              <label htmlFor="platActive" className="text-sm font-medium text-gray-700">Is Active</label>
            </div>
            
            <AppPrimaryButton type="submit" disabled={savingPlatform} className="w-full justify-center">
              {savingPlatform ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Platform Fees'}
            </AppPrimaryButton>
          </form>
        </GlassPanel>

        {/* Miscellaneous Settings (Wallet, GST, Penalty) */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Minimum Wallet Limit */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Min. Wallet Limit</h2>
            {messages.wallet && (
              <div className={`p-2 rounded mb-2 text-xs ${messages.wallet.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {messages.wallet.text}
              </div>
            )}
            <form onSubmit={handleUpdateWalletLimit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount (₹)</label>
                <input 
                  type="number"
                  min="0"
                  required
                  value={settings.walletLimit ?? ''}
                  onChange={(e) => setSettings({...settings, walletLimit: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand outline-none"
                />
              </div>
              <AppPrimaryButton type="submit" disabled={savingWallet} className="w-full justify-center">
                {savingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Limit'}
              </AppPrimaryButton>
            </form>
          </GlassPanel>

          {/* GST Percentage */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">GST Percentage</h2>
            {messages.gst && (
              <div className={`p-2 rounded mb-2 text-xs ${messages.gst.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {messages.gst.text}
              </div>
            )}
            <form onSubmit={handleUpdateGst} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Percentage (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={settings.gstPercentage ?? ''}
                  onChange={(e) => setSettings({...settings, gstPercentage: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand outline-none"
                />
              </div>
              <AppPrimaryButton type="submit" disabled={savingGst} className="w-full justify-center">
                {savingGst ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save GST'}
              </AppPrimaryButton>
            </form>
          </GlassPanel>

          {/* Cancellation Penalty */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cancellation Penalty</h2>
            {messages.penalty && (
              <div className={`p-2 rounded mb-2 text-xs ${messages.penalty.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {messages.penalty.text}
              </div>
            )}
            <form onSubmit={handleUpdatePenalty} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fixed Amount (₹)</label>
                <input 
                  type="number"
                  min="0"
                  required
                  value={settings.cancellationPenalty ?? ''}
                  onChange={(e) => setSettings({...settings, cancellationPenalty: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-brand outline-none"
                />
              </div>
              <AppPrimaryButton type="submit" disabled={savingPenalty} className="w-full justify-center">
                {savingPenalty ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Penalty'}
              </AppPrimaryButton>
            </form>
          </GlassPanel>

        </div>
      </div>
    </div>
  )
}
