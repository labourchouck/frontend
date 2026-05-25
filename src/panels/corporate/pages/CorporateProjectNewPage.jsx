import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useCreateCorporateProjectMutation } from '../../../store/api/workforceApi.js'

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  )
}

export function CorporateProjectNewPage() {
  const navigate = useNavigate()
  const [createProject, { isLoading }] = useCreateCorporateProjectMutation()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [siteName, setSiteName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Project name is required')
      return
    }
    try {
      const body = {
        name: name.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      }
      if (siteName.trim()) {
        body.site = { name: siteName.trim(), address: siteAddress.trim() || undefined }
      }
      const res = await createProject(body).unwrap()
      const id = res?.project?._id
      navigate(id ? `/corporate/projects/${id}` : '/corporate/projects')
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not create project')
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <Link
        to="/corporate/projects"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to projects
      </Link>

      <AppSurface>
        <h2 className="text-lg font-extrabold text-slate-900">New project</h2>
        <p className="mt-1 text-sm text-slate-600">Add a project and optional first site.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Project name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date">
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">First site (optional)</p>
            <div className="mt-3 space-y-3">
              <Field label="Site name">
                <input className={inputClass} value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </Field>
              <Field label="Address">
                <input className={inputClass} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
              </Field>
            </div>
          </div>
          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          <AppPrimaryButton type="submit" className="w-full" loading={isLoading}>
            Create project
          </AppPrimaryButton>
        </form>
      </AppSurface>
    </div>
  )
}

