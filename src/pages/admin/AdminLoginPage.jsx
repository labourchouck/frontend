import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { adminEmailLogin } from '../../api/authApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { ApiError } from '../../api/http.js'
import { USER_ROLES } from '../../constants/userRoles.js'

/**
 * Web-focused admin sign-in (email + password). Full dashboard comes in Admin module.
 */
export function AdminLoginPage() {
  const navigate = useNavigate()
  const { applySession, token, realUser, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (loading) return
    if (token && realUser?.role === USER_ROLES.ADMIN) {
      navigate('/admin', { replace: true })
    }
  }, [loading, token, realUser, navigate])

  if (loading || (token && realUser?.role === USER_ROLES.ADMIN)) {
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      const res = await adminEmailLogin({ email: email.trim(), password })
      const { token, user } = res.data
      if (user.role !== USER_ROLES.ADMIN) {
        setMessage('Not an admin account')
        return
      }
      applySession(token, user)
      navigate('/admin', { replace: true })
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const fieldClass =
    'w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-[16px] font-medium text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-brand focus:ring-0'
  const labelClass = 'mb-1 block text-[13px] font-medium text-slate-400'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f1e7e4] px-4 py-8 selection:bg-brand/20">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px]">
          <svg
            viewBox="0 0 375 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full fill-current text-brand drop-shadow-sm"
          >
            <path d="M0 0H375V150C375 150 310 200 250 180C190 160 130 140 70 170C30 190 0 150 0 150V0Z" />
          </svg>
        </div>

        <div className="relative z-10 px-8 pb-10 pt-8">
          <img src="/assets/images/mappto_logo_white.png" alt="Mappto" className="-ml-4 mb-9 h-[110px] w-auto object-contain" />
          <h1 className="mt-4 text-[32px] font-bold tracking-tight text-brand">Admin panel</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Sign in to manage Mappto.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                autoComplete="username"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`${fieldClass} pr-10`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 transition hover:text-brand"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            </div>

            {message ? (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600" role="alert">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand py-3.5 text-[16px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(34,139,34,0.5)] transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            <Link to="/b2c/auth" className="font-semibold text-brand hover:underline">
              Mobile OTP login
            </Link>
            {' · '}
            <Link to="/" className="font-semibold text-brand hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
