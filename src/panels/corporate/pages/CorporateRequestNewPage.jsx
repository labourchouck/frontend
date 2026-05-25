import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { apiRequest } from '../../../api/http.js'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import {
  useCreateRequestMutation,
  useGetCorporateProjectsQuery,
} from '../../../store/api/workforceApi.js'

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'long_term', label: 'Long term' },
]

function emptyLine() {
  return { categoryId: '', quantity: 1 }
}

export function CorporateRequestNewPage() {
  const navigate = useNavigate()
  const { data: projectsData } = useGetCorporateProjectsQuery()
  const [createRequest, { isLoading }] = useCreateRequestMutation()
  const projects = projectsData?.projects ?? []

  const [projectId, setProjectId] = useState('')
  const [scheduleType, setScheduleType] = useState('daily')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [shiftStart, setShiftStart] = useState('08:00')
  const [shiftEnd, setShiftEnd] = useState('18:00')
  const [locationText, setLocationText] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([emptyLine()])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const json = await apiRequest('/labour-categories/grouped')
        if (cancelled) return
        const payload = json?.data ?? json
        const flat = []
        for (const group of payload?.groups ?? []) {
          for (const c of group.categories ?? []) {
            flat.push({ id: c._id || c.id, name: c.name, group: group.name })
          }
        }
        setCategories(flat)
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
    const validLines = lines.filter((l) => l.categoryId)
    if (!validLines.length) {
      setError('Add at least one skill line')
      return
    }
    if (!startDate) {
      setError('Start date is required')
      return
    }
    try {
      await createRequest({
        projectId: projectId || undefined,
        scheduleType,
        startDate,
        endDate: endDate || undefined,
        shiftStart,
        shiftEnd,
        locationText: locationText.trim() || undefined,
        notes: notes.trim() || undefined,
        lines: validLines.map((l) => ({
          categoryId: l.categoryId,
          quantity: Number(l.quantity) || 1,
        })),
      }).unwrap()
      navigate('/corporate/requests')
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Could not create request')
    }
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
            <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
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
                Add line
              </button>
            </div>
            <ul className="space-y-2">
              {lines.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <select
                    className={`${inputClass} flex-1`}
                    value={line.categoryId}
                    onChange={(e) => updateLine(idx, { categoryId: e.target.value })}
                    required={idx === 0}
                  >
                    <option value="">Select skill</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.group ? ` (${c.group})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className={`${inputClass} w-20`}
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                  />
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Schedule
            </label>
            <select
              className={inputClass}
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
            >
              {SCHEDULE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Location
            </label>
            <input className={inputClass} value={locationText} onChange={(e) => setLocationText(e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Notes</label>
            <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

          <AppPrimaryButton type="submit" className="w-full" loading={isLoading}>
            Submit request
          </AppPrimaryButton>
        </form>
      </AppSurface>
    </div>
  )
}
