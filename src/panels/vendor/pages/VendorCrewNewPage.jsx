import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { VendorCard, VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { vendorApi } from '../../../api/vendorApi.js'

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

export function VendorCrewNewPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '').slice(-10)
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    
    setLoading(true)
    try {
      const res = await vendorApi.requestWorkerLink(digits)
      if (res?.data?.needsOtp) {
        setChallengeId(res.data.challengeId)
      } else {
        // Direct link success
        navigate('/vendor/crew')
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not initiate worker link')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!code) {
      setError('Enter the OTP code')
      return
    }
    
    setLoading(true)
    try {
      await vendorApi.verifyWorkerLink({
        phone: phone.replace(/\D/g, '').slice(-10),
        code,
        challengeId
      })
      navigate('/vendor/crew')
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Verification failed')
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
        <h2 className="text-lg font-extrabold text-slate-900">Link crew member</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Worker must have a LabourChowck labour account on this number.
        </p>
        {challengeId ? (
          <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">OTP Code</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Enter 6-digit OTP"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
            <AppPrimaryButton type="submit" className="w-full" loading={loading}>
              Verify & Link Worker
            </AppPrimaryButton>
            <button 
              type="button" 
              onClick={() => { setChallengeId(null); setCode(''); setError(''); }}
              className="w-full py-3 text-sm font-bold text-slate-500"
            >
              Cancel
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-500">Mobile</label>
              <input
                type="tel"
                className={inputClass}
                placeholder="10-digit phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
            <AppPrimaryButton type="submit" className="w-full" loading={loading}>
              Send Link Request
            </AppPrimaryButton>
          </form>
        )}
      </VendorCard>
    </VendorPageLayout>
  )
}
