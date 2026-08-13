import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  HardHat,
  Home,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { MobileShell } from '../../layouts/MobileShell.jsx'
import { AppAmbientBackground } from '../../components/app/AppAmbientBackground.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { LabourCategorySetup } from '../../components/auth/LabourCategorySetup.jsx'
import { ROLE_LABELS, USER_ROLES } from '../../constants/userRoles.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { requestLoginOtp, requestRegisterOtp, verifyLogin, verifyRegister } from '../../api/authApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { ApiError } from '../../api/http.js'

const ROLE_OPTIONS = [
  {
    role: USER_ROLES.INDIVIDUAL,
    icon: Home,
    desc: 'Hire verified labour for your home or renovation',
  },
  {
    role: USER_ROLES.CORPORATE,
    icon: Building2,
    desc: 'Bulk workforce for sites and projects',
  },
  {
    role: USER_ROLES.LABOUR,
    icon: HardHat,
    desc: 'Get matched to jobs near you',
  },
  {
    role: USER_ROLES.CONTRACTOR,
    icon: ClipboardList,
    desc: 'Supply and deploy crews for clients',
  },
]

function isValidIndianMobile(digits) {
  return digits.length === 10 && /^[6-9]\d{9}$/.test(digits)
}

const OTP_BYPASS_HINT = import.meta.env.VITE_OTP_BYPASS_HINT === 'true'

function demoOtpFromPhone(digits) {
  if (!digits || digits.length < 6) return null
  return digits.slice(-6)
}

function FeedbackBanner({ variant, children }) {
  if (!children) return null
  const styles =
    variant === 'error'
      ? 'border-amber-200/90 bg-amber-50 text-amber-950 ring-amber-100'
      : 'border-emerald-200/90 bg-emerald-50 text-emerald-950 ring-emerald-100'
  return (
    <p role="alert" className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-relaxed ring-1 ${styles}`}>
      {children}
    </p>
  )
}

function AuthField({ label, hint, children }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-[12px] font-medium text-slate-400">{label}</label>
        {hint}
      </div>
      {children}
    </div>
  )
}

const inputClass =
  'w-full border-b-2 border-slate-200 bg-transparent py-2 text-base font-semibold text-slate-900 transition-colors focus:border-brand focus:outline-none placeholder:text-slate-300'

export function AuthEntryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applySession } = useAuth()
  const reduce = useReducedMotion()
  const otpInputRefs = useRef([])

  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('form')
  const [role, setRole] = useState(location.state?.defaultRole || USER_ROLES.INDIVIDUAL)
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [otpCells, setOtpCells] = useState(() => Array(6).fill(''))
  const [challengeId, setChallengeId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  const p = isValidIndianMobile(phone) ? phone : null
  const code = otpCells.join('')
  const phoneComplete = phone.length === 10

  function clearOtpError() {
    setBanner((b) => (b?.variant === 'error' ? null : b))
  }

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
    clearOtpError()
    const nextEmpty = cells.findIndex((c) => c === '')
    queueMicrotask(() => {
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    })
  }

  useEffect(() => {
    if (step !== 'otp') return
    queueMicrotask(() => {
      otpInputRefs.current[0]?.focus()
    })
  }, [step])

  function setPhoneDigits(value) {
    const digits = String(value).replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
    if (banner?.variant === 'error') setBanner(null)
  }

  function resetFlowToForm() {
    setStep('form')
    setChallengeId(null)
    setBanner(null)
    setOtpCells(Array(6).fill(''))
  }

  function switchMode(next) {
    setMode(next)
    resetFlowToForm()
  }

  async function handleSendOtp() {
    setBanner(null)
    setChallengeId(null)
    if (!isValidIndianMobile(phone)) {
      setBanner({
        variant: 'error',
        message: 'Enter exactly 10 digits starting with 6, 7, 8, or 9.',
      })
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        const res = await requestLoginOtp({ phone: p })
        setChallengeId(res.data?.challengeId ?? null)
      } else {
        if (role === USER_ROLES.CORPORATE && !companyName.trim()) {
          setBanner({ variant: 'error', message: 'Company name is required.' })
          setBusy(false)
          return
        }
        if (role === USER_ROLES.CONTRACTOR && !businessName.trim()) {
          setBanner({ variant: 'error', message: 'Business name is required.' })
          setBusy(false)
          return
        }
        const res = await requestRegisterOtp({
          phone: p,
          role,
          fullName: fullName.trim() || undefined,
        })
        setChallengeId(res.data?.challengeId ?? null)
      }
      setOtpCells(Array(6).fill(''))
      setStep('otp')
      setBanner({
        variant: 'success',
        message: OTP_BYPASS_HINT && p
          ? `Demo OTP: enter the last 6 digits of ${p} (${demoOtpFromPhone(p)}).`
          : 'OTP sent. Check SMS — in development it may appear in the server terminal.',
      })
    } catch (e) {
      setBanner({
        variant: 'error',
        message: e instanceof ApiError ? e.message : 'Could not send OTP. Try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp() {
    setBanner(null)
    if (code.length !== 6) {
      setBanner({ variant: 'error', message: 'Enter all 6 digits of the OTP.' })
      return
    }
    if (!challengeId) {
      setBanner({ variant: 'error', message: 'Session expired. Go back and tap Send OTP again.' })
      return
    }
    if (!p) {
      setBanner({ variant: 'error', message: 'Phone number is invalid. Go back and fix it.' })
      return
    }
    setBusy(true)
    try {
      let signedInUser
      if (mode === 'login') {
        const res = await verifyLogin({ phone: p, code, challengeId })
        const { token, user } = res.data
        applySession(token, user)
        signedInUser = user
      } else {
        if (!fullName.trim()) {
          setBanner({ variant: 'error', message: 'Full name is required to complete registration.' })
          setBusy(false)
          return
        }
        const body = {
          phone: p,
          role,
          code,
          challengeId,
          fullName: fullName.trim(),
        }
        if (role === USER_ROLES.CORPORATE) {
          body.companyName = companyName.trim()
          if (gstNumber.trim()) body.gstNumber = gstNumber.trim().toUpperCase()
        }
        if (role === USER_ROLES.CONTRACTOR) {
          body.businessName = businessName.trim()
        }
        const res = await verifyRegister(body)
        const { token, user } = res.data
        applySession(token, user)
        signedInUser = user
      }

      const needsWorkSetup =
        signedInUser.role === USER_ROLES.LABOUR && !(signedInUser.labourProfile?.categoryIds?.length > 0)
      if (needsWorkSetup) {
        setStep('work-setup')
        setBanner(null)
      } else {
        const returnPath = location.state?.from || getRoleHomePath(signedInUser.role)
        navigate(returnPath, { replace: true })
      }
    } catch (e) {
      setBanner({
        variant: 'error',
        message: e instanceof ApiError ? e.message : 'Verification failed. Check the code and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  if (step === 'work-setup') {
    return (
      <>
        <AppAmbientBackground />
        <MobileShell transparent className="pb-0 pt-4">
          <LabourCategorySetup variant="auth" onComplete={() => {
            const returnPath = location.state?.from || getRoleHomePath(USER_ROLES.LABOUR)
            navigate(returnPath, { replace: true })
          }} />
        </MobileShell>
      </>
    )
  }

  return (
    <>
      <div className="absolute inset-x-0 top-0 -z-10">
        <svg viewBox="0 0 375 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-brand fill-current drop-shadow-sm">
          <path d="M0 0H375V150C375 150 310 200 250 180C190 160 130 140 70 170C30 190 0 150 0 150V0Z" />
        </svg>
      </div>
      <MobileShell transparent className="relative z-10 overflow-x-hidden pb-4 min-h-screen">
        <div className="px-6 pt-12 pb-3 flex flex-col items-start">
          <img src="/logo-white.svg" alt="Labour Chowk" className="-ml-3 h-[52px] w-auto mb-16 drop-shadow-sm" />
          <h1 className="text-[32px] font-bold tracking-tight text-brand mt-4">
            {step === 'otp' ? 'Verification' : mode === 'login' ? 'Hi there!' : 'Welcome!'}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {step === 'otp'
              ? 'Enter the code sent to your number'
              : mode === 'login'
              ? 'Welcome back.'
              : 'Sign up to continue.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? false : { opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {mode === 'register' ? (
                <div className="px-6 mb-3">
                  <p className="mb-2 text-[12px] font-medium text-slate-400">I am a</p>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLE_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const active = role === opt.role
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => setRole(opt.role)}
                          className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-[1rem] border p-2 text-center transition-all duration-300 active:scale-95 ${
                            active
                              ? 'border-brand bg-brand/5 shadow-sm shadow-brand/10'
                              : 'border-slate-200/60 bg-transparent hover:border-brand/30'
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                              active ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'bg-slate-100 text-slate-500 group-hover:bg-brand/10 group-hover:text-brand'
                            }`}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="text-[12px] font-bold text-slate-800 leading-tight">{ROLE_LABELS[opt.role]}</span>
                          {active && (
                            <motion.div
                              layoutId="role-active-indicator"
                              className="absolute inset-0 rounded-[1.25rem] border-2 border-brand"
                              initial={false}
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {role === USER_ROLES.LABOUR ? (
                    <p className="mt-2 rounded-xl bg-brand/5 px-3 py-2 text-[11px] leading-relaxed text-slate-600 ring-1 ring-brand/15">
                      After OTP, you&apos;ll pick your work areas and roles on this screen.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-3 px-6">
                <AuthField
                  label="Mobile Number"
                  hint={
                    mode === 'register' ? (
                      <span className={`text-xs tabular-nums ${phoneComplete ? 'font-bold text-brand' : 'text-slate-400'}`}>
                        {phone.length}/10
                      </span>
                    ) : null
                  }
                >
                  <div
                    className={`flex items-end border-b-2 transition-colors duration-300 ${
                      banner?.variant === 'error' && phone.length > 0 && !phoneComplete
                        ? 'border-amber-400'
                        : 'border-slate-200 focus-within:border-brand'
                    }`}
                  >
                    <span className="mb-2 mr-2 text-[15px] font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      id="auth-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      placeholder="9876543210"
                      className="w-full bg-transparent py-2 text-base font-semibold tracking-wide text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-300"
                      value={phone}
                      onChange={(e) => setPhoneDigits(e.target.value)}
                      onKeyDown={(e) => {
                        const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
                        if (allowed.includes(e.key)) return
                        if (e.ctrlKey || e.metaKey) return
                        if (!/^\d$/.test(e.key)) e.preventDefault()
                      }}
                    />
                  </div>
                </AuthField>

                {mode === 'register' ? (
                  <>
                    <AuthField label="Full name">
                      <input
                        type="text"
                        className={inputClass}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As on your ID"
                        autoComplete="name"
                      />
                    </AuthField>
                    {role === USER_ROLES.CORPORATE ? (
                      <>
                        <AuthField label="Company name">
                          <input
                            type="text"
                            className={inputClass}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </AuthField>
                        <AuthField label="GST (optional)">
                          <input
                            type="text"
                            maxLength={15}
                            className={inputClass}
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                          />
                        </AuthField>
                      </>
                    ) : null}
                    {role === USER_ROLES.CONTRACTOR ? (
                      <AuthField label="Business name">
                        <input
                          type="text"
                          className={inputClass}
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </AuthField>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="px-6 pt-3 pb-2">
                <FeedbackBanner variant={banner?.variant}>{banner?.message}</FeedbackBanner>
                <button 
                  type="button" 
                  disabled={busy} 
                  className="mt-3 w-full rounded-full bg-brand py-3 text-[15px] font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-active active:scale-95 disabled:opacity-70" 
                  onClick={() => void handleSendOtp()}
                >
                  {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
                
                <div className="mt-4 text-left">
                  <p className="text-[13px] font-medium text-slate-400">
                    {mode === 'login' ? 'New member?' : 'Already a member?'}
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="mt-1 text-[15px] font-bold text-brand transition-colors hover:text-brand-active"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? false : { opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="px-6 pt-4 space-y-6">
                <p className="text-[14px] font-medium text-slate-500">
                  Code sent to <span className="font-bold text-slate-900">+91 {phone}</span>
                </p>
                {OTP_BYPASS_HINT && p ? (
                  <p className="rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-[13px] font-semibold text-brand">
                    Demo: OTP is {demoOtpFromPhone(p)}
                  </p>
                ) : null}
                <div className="mt-6 flex justify-between gap-2" onPaste={handleOtpPaste}>
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
                      className="h-12 w-11 border-b-2 border-slate-200 bg-transparent text-center font-mono text-2xl font-bold tabular-nums text-slate-900 outline-none transition-colors focus:border-brand"
                      value={digit}
                      onPaste={handleOtpPaste}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '').slice(-1)
                        const next = [...otpCells]
                        if (d) {
                          next[i] = d
                          setOtpCells(next)
                          clearOtpError()
                          if (i < 5) otpInputRefs.current[i + 1]?.focus()
                        } else {
                          next[i] = ''
                          setOtpCells(next)
                          clearOtpError()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (!busy) void handleVerifyOtp()
                          return
                        }
                        if (e.key === 'Backspace') {
                          e.preventDefault()
                          if (otpCells[i]) {
                            const next = [...otpCells]
                            next[i] = ''
                            setOtpCells(next)
                            clearOtpError()
                          } else if (i > 0) {
                            const next = [...otpCells]
                            next[i - 1] = ''
                            setOtpCells(next)
                            clearOtpError()
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
              </div>

              <div className="px-6 pt-4 pb-2">
                <FeedbackBanner variant={banner?.variant}>{banner?.message}</FeedbackBanner>
                <button
                  type="button"
                  disabled={busy}
                  className="mt-4 w-full rounded-full bg-brand py-3 text-[15px] font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-active active:scale-95 disabled:opacity-70"
                  onClick={() => void handleVerifyOtp()}
                >
                  {busy ? 'Verifying…' : 'Verify'}
                </button>
                <button
                  type="button"
                  className="mt-4 w-full py-2 text-[14px] font-bold text-brand transition-colors hover:text-brand-active"
                  onClick={resetFlowToForm}
                >
                  Change mobile number
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-center text-[12px] text-slate-500">
          Admin?{' '}
          <Link to="/admin/login" className="font-bold text-brand hover:underline">
            Web login
          </Link>
        </p>
      </MobileShell>
    </>
  )
}
