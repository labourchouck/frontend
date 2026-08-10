import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, PackageOpen, RefreshCw, Search } from 'lucide-react'
import {
  getVendorBuildmartEnquiries,
  updateVendorBuildmartEnquiryStatus,
} from '../../../api/vendorBuildmartApi.js'
import { ApiError } from '../../../api/http.js'

import { AppSearchableSelect } from '../../../components/app-ui/inputs/AppSearchableSelect.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

function StatusPill({ status }) {
  const tones = {
    new: 'bg-orange-50 text-orange-900 ring-orange-200/80',
    contacted: 'bg-sky-50 text-sky-900 ring-sky-200/80',
    quoted: 'bg-violet-50 text-violet-900 ring-violet-200/80',
    won: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
    lost: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${tones[status] || tones.new}`}
    >
      {status}
    </span>
  )
}

export function VendorMartEnquiriesPage() {
  const reduce = useReducedMotion()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 350)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debounced, status])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getVendorBuildmartEnquiries({
        status,
        page,
        limit: 15,
      })
      // Local search fallback if backend doesn't handle 'search' query on vendor yet
      let fetchedItems = data?.items ?? []
      if (debounced) {
        const lower = debounced.toLowerCase()
        fetchedItems = fetchedItems.filter(item => 
          item.productName?.toLowerCase().includes(lower) || 
          item.name?.toLowerCase().includes(lower) ||
          item.phone?.includes(debounced)
        )
      }
      setItems(fetchedItems)
      setTotal(data?.total ?? fetchedItems.length)
      setPages(data?.pages ?? 1)
    } catch (e) {
      setItems([])
      setError(e instanceof ApiError ? e.message : 'Could not load leads')
    } finally {
      setLoading(false)
    }
  }, [debounced, status, page])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusChange(id, next) {
    try {
      await updateVendorBuildmartEnquiryStatus(id, next)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col buildmart-gradient-soft overflow-hidden overscroll-none">
      <div className="shrink-0 flex items-center justify-between px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <Link to="/vendor/mart" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 border border-slate-200/80">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Product Leads</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quote Requests</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 border border-slate-200/80"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-20 pt-2">
        <VendorPageLayout>
          <div className="px-4 space-y-6">

      <GlassPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center rounded-3xl border border-orange-100/90 shadow-sm">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, product…"
            className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-medium focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-brand focus:ring-1 focus:ring-brand"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </GlassPanel>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 ring-1 ring-rose-200/80">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {loading && items.length === 0 ? (
          <p className="text-sm font-semibold text-slate-500 text-center py-8">Loading leads…</p>
        ) : items.length === 0 ? (
          <GlassPanel className="p-12 text-center rounded-3xl border border-slate-200/80">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4 ring-1 ring-slate-100">
              <PackageOpen className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-base font-bold text-slate-900">No leads yet</p>
            <p className="mt-1 text-sm text-slate-500">You haven't received any quote requests.</p>
          </GlassPanel>
        ) : (
          items.map((lead, index) => {
            return (
              <GlassPanel 
                key={lead._id} 
                className="p-5 rounded-3xl border border-orange-100/90 shadow-sm !overflow-visible relative"
                style={{ zIndex: 50 - index }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-extrabold text-slate-900">{lead.productName}</p>
                      <StatusPill status={lead.status} />
                    </div>
                    {lead.variantLabel ? (
                      <p className="text-xs font-bold text-bm-terracotta tracking-wide uppercase">Variant: {lead.variantLabel}</p>
                    ) : null}
                    
                    <div className="bg-slate-50 rounded-2xl p-4 mt-2 ring-1 ring-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                          <p className="font-bold text-slate-800">{lead.name}</p>
                          <p className="text-slate-600 font-mono mt-0.5">{lead.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requirements</p>
                          <p className="font-bold text-slate-800">Qty: {lead.quantity}</p>
                          <p className="text-slate-600 mt-0.5">{lead.siteLocation}</p>
                        </div>
                      </div>
                      {(lead.deliveryDate || lead.notes) && (
                        <div className="mt-3 pt-3 border-t border-slate-200/70">
                          {lead.deliveryDate && <p className="text-xs font-semibold text-slate-700"><span className="text-slate-500">Delivery:</span> {lead.deliveryDate}</p>}
                          {lead.notes && <p className="text-xs font-semibold text-slate-700 mt-1"><span className="text-slate-500">Notes:</span> {lead.notes}</p>}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[10px] font-bold text-slate-400 pt-1">
                      Received: {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end w-full sm:w-auto">
                    {lead.whatsappUrl ? (
                      <a
                        href={lead.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#20bd5a] w-full"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        Message
                      </a>
                    ) : null}
                    
                    <div className="w-full">
                      <label className="sr-only">Update Status</label>
                      <AppSearchableSelect
                        value={lead.status}
                        onChange={(val) => handleStatusChange(lead._id, val)}
                        options={STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => ({
                          label: `Mark as ${o.label}`,
                          value: o.value
                        }))}
                        hideSearch
                        placeholder="Update Status"
                        className="font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </GlassPanel>
            )
          })
        )}
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm transition disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm transition disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
          ) : null}
          </div>
        </VendorPageLayout>
      </div>
    </div>
  )
}
