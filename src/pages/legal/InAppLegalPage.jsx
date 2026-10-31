import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DynamicLegalDocument } from '../../components/legal/DynamicLegalDocument.jsx'
import { LEGAL_DOCS } from '../../data/legalContent.js'

/** In-app Terms / Privacy screen opened from sign-up; back returns to the previous screen. */
export function InAppLegalPage({ kind }) {
  const doc = LEGAL_DOCS[kind]
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'individual'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/b2c/auth', { replace: true }))

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <h1 className="text-[17px] font-black tracking-tight text-slate-900">{doc.title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <DynamicLegalDocument kind={kind} role={role} variant="public" />
      </main>
    </div>
  )
}
