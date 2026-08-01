import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Sparkles, Phone, User } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { vendorApi } from '../../../api/vendorApi.js'

export function VendorCrewNewPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otpCells, setOtpCells] = useState(() => Array(6).fill(''))
  const [challengeId, setChallengeId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const otpInputRefs = useRef([])

  const phoneComplete = phone.length === 10
  const code = otpCells.join('')

  useEffect(() => {
    if (challengeId) {
      queueMicrotask(() => {
        otpInputRefs.current[0]?.focus()
      })
    }
  }, [challengeId])

  function digitsToOtpCells(raw) {
    const d = String(raw ?? '').replace(/\D/g, '').slice(0, 6)
    const out = Array(6).fill('')
    for (let k = 0; k < d.length; k++) out[k] = d[k]
    return out
  }

  function handleOtpPaste(e) {
    e.preventDefault()
    const cells = digitsToOtpCells(e.clipboardData.getData('text/plain'))
    setOtpCells(cells)
    setError('')
    const nextEmpty = cells.findIndex((c) => c === '')
    queueMicrotask(() => {
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    })
  }

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '').slice(-10)
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    
    setLoading(true)
    try {
      const res = await vendorApi.requestCrewOtp(digits)
      if (res?.data?.needsOtp) {
        setChallengeId(res.data.challengeId)
        if (import.meta.env.DEV) {
          setOtpCells(digitsToOtpCells(digits.slice(-6)))
        }
      } else {
        // Direct link success
        navigate('/vendor/crew/create-profile', { state: { phone: digits } })
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not initiate worker link')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('Enter all 6 digits of the OTP code')
      return
    }
    
    setLoading(true)
    try {
      await vendorApi.verifyCrewOtp({
        phone: phone.replace(/\D/g, '').slice(-10),
        code,
        challengeId
      })
      navigate('/vendor/crew/create-profile', { state: { phone: phone.replace(/\D/g, '').slice(-10) } })
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <VendorPageLayout>
      <Link to="/vendor/crew" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brand">
        <ArrowLeft className="h-4 w-4" />
        Crew
      </Link>

      <GlassPanel className="mb-5 overflow-hidden border-slate-200/90 p-4 ring-1 ring-slate-100/90">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-bright to-brand text-white shadow-md ring-1 ring-brand/25">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Add crew member</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Verify mobile number to create a new vendor crew profile.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
              Secure · Number will be registered to your crew
            </p>
          </div>
        </div>
      </GlassPanel>

      {!challengeId ? (
        <div className="space-y-4">
          <GlassPanel className="space-y-4 border-slate-200/90 p-4 ring-1 ring-slate-100/90">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mobile number</label>
                <span className={`text-xs tabular-nums ${phoneComplete ? 'font-bold text-brand' : 'text-slate-400'}`}>
                  {phone.length}/10
                </span>
              </div>
              <div
                className={`flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition focus-within:ring-2 ${
                  error && phone.length > 0 && !phoneComplete
                    ? 'ring-amber-300'
                    : 'focus-within:ring-brand/30'
                }`}
              >
                <span className="flex items-center border-r border-slate-100 bg-slate-50 px-3.5 text-sm font-bold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="9876543210"
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-lg font-semibold tracking-wide text-slate-900 outline-none"
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setPhone(digits)
                    setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!loading) void handleRequestOtp()
                    }
                  }}
                />
              </div>
            </div>
          </GlassPanel>

          {error ? (
            <p role="alert" className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950 ring-1 ring-amber-100">
              {error}
            </p>
          ) : null}

          <AppPrimaryButton type="button" disabled={loading} className="w-full py-3.5 text-[15px]" onClick={() => void handleRequestOtp()}>
            {loading ? 'Please wait…' : 'Send Link Request'}
            <Phone className="h-4 w-4" aria-hidden />
          </AppPrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <GlassPanel className="border-slate-200/90 p-4 ring-1 ring-slate-100/90">
            <p className="text-sm text-slate-600">
              Code sent to{' '}
              <span className="font-bold tabular-nums text-slate-900">+91 {phone}</span>
            </p>
            {import.meta.env.DEV && (
              <p className="mt-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand">
                Demo: OTP is the last 6 digits of your number.
              </p>
            )}
            <p className="mt-4 mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Enter OTP</p>
            <div className="flex gap-2" onPaste={handleOtpPaste}>
              {otpCells.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputRefs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  aria-label={`OTP digit ${i + 1} of 6`}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200/90 bg-white py-4 text-center font-mono text-xl font-bold tabular-nums text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-brand/35"
                  value={digit}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '').slice(-1)
                    const next = [...otpCells]
                    if (d) {
                      next[i] = d
                      setOtpCells(next)
                      setError('')
                      if (i < 5) otpInputRefs.current[i + 1]?.focus()
                    } else {
                      next[i] = ''
                      setOtpCells(next)
                      setError('')
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!loading) void handleVerifyOtp()
                      return
                    }
                    if (e.key === 'Backspace') {
                      e.preventDefault()
                      if (otpCells[i]) {
                        const next = [...otpCells]
                        next[i] = ''
                        setOtpCells(next)
                        setError('')
                      } else if (i > 0) {
                        const next = [...otpCells]
                        next[i - 1] = ''
                        setOtpCells(next)
                        setError('')
                        otpInputRefs.current[i - 1]?.focus()
                      }
                      return
                    }
                    if (e.key === 'ArrowLeft' && i > 0) {
                      e.preventDefault()
                      otpInputRefs.current[i - 1]?.focus()
                      return
                    }
                    if (e.key === 'ArrowRight' && i < 5) {
                      e.preventDefault()
                      otpInputRefs.current[i + 1]?.focus()
                      return
                    }
                    if (e.ctrlKey || e.metaKey) return
                    if (!/^\d$/.test(e.key) && e.key.length === 1) e.preventDefault()
                  }}
                />
              ))}
            </div>
          </GlassPanel>

          {error ? (
            <p role="alert" className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950 ring-1 ring-amber-100">
              {error}
            </p>
          ) : null}

          <AppPrimaryButton
            type="button"
            disabled={loading}
            className="w-full py-3.5 text-[15px]"
            onClick={() => void handleVerifyOtp()}
          >
            {loading ? 'Verifying…' : 'Verify & continue'}
            <User className="h-4 w-4" aria-hidden />
          </AppPrimaryButton>
          <button
            type="button"
            className="w-full py-2 text-sm font-bold text-brand"
            onClick={() => { setChallengeId(null); setOtpCells(Array(6).fill('')); setError(''); }}
          >
            Edit mobile number
          </button>
        </div>
      )}
    </VendorPageLayout>
  )
}
