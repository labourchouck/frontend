import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DynamicLegalDocument } from '../../components/legal/DynamicLegalDocument.jsx'
import { COMPANY, LEGAL_DOCS } from '../../data/legalContent.js'

/** Public website page for the Terms (kind="terms") or Privacy Policy (kind="privacy"). */
export function PublicLegalPage({ kind }) {
  const doc = LEGAL_DOCS[kind]
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'individual'
  const roleQuery = searchParams.has('role') ? `?role=${searchParams.get('role')}` : ''

  useEffect(() => {
    const previous = document.title
    document.title = `${doc.title} — ${COMPANY.brand}`
    window.scrollTo(0, 0)
    return () => {
      document.title = previous
    }
  }, [doc.title])

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link
            to="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/images/mappto_logo_tile_white.png" alt="" className="h-8 w-8 rounded-lg ring-1 ring-slate-200" />
            <span className="text-[17px] font-black tracking-tight text-slate-900">{COMPANY.brand}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-[13px] font-bold">
            <Link to={`/terms${roleQuery}`} className={kind === 'terms' ? 'text-brand' : 'text-slate-500 hover:text-slate-800'}>
              Terms
            </Link>
            <Link to={`/privacy${roleQuery}`} className={kind === 'privacy' ? 'text-brand' : 'text-slate-500 hover:text-slate-800'}>
              Privacy
            </Link>
            <Link to={`/support${roleQuery}`} className={kind === 'support' ? 'text-brand' : 'text-slate-500 hover:text-slate-800'}>
              Support
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <DynamicLegalDocument kind={kind} role={role} variant="public" />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-[12px] text-slate-500">
        © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
      </footer>
    </div>
  )
}
