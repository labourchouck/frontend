import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, Loader2, MapPin, Package, RefreshCw } from 'lucide-react'
import { AppStackScreenHeader } from '../../../components/app/AppStackScreenHeader.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { LeadTimeline } from '../../../components/buildmart/LeadTimeline.jsx'
import { fetchMyBuildMartQuotes } from '../../../api/buildmartApi.js'
import { ApiError } from '../../../api/http.js'
import { useSocket } from '../../../context/SocketContext.jsx'
import { LEAD_TABS, STATUS_TONE, customerStatusLabel, martBasePath } from '../../../lib/buildmartLeadStatus.js'

const formatDay = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function OrderCard({ item }) {
  const [open, setOpen] = useState(false)
  const latest = item.history[item.history.length - 1]
  return (
    <GlassPanel className="p-4" data-testid="mart-order">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70">
          {item.productImage ? (
            <img src={item.productImage} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Package className="h-7 w-7" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[15px] font-extrabold leading-tight text-slate-900">{item.productName}</p>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${STATUS_TONE[item.status] || STATUS_TONE.new}`}>
              {customerStatusLabel(item.status)}
            </span>
          </div>
          {item.variantLabel ? <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">{item.variantLabel}</p> : null}
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Qty {item.quantity} · {item.sellerName}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Requested {formatDay(item.createdAt)}</p>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-slate-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0">
          {item.siteLocation}
          {item.deliveryDate ? ` · Needed by ${item.deliveryDate}` : ''}
        </span>
      </p>

      {latest?.note && !(latest.status === 'new' && latest.note === 'Request submitted') ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
          Latest update: “{latest.note}”
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition active:scale-[0.99]"
      >
        <span>
          Updates <span className="text-slate-400">({item.history.length})</span>
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open ? (
        <div className="mt-3 px-1">
          <LeadTimeline history={item.history} audience="customer" sellerName={item.sellerName} />
        </div>
      ) : null}
    </GlassPanel>
  )
}

/** "Mart orders & updates": every material request the user has made, with what happened to each. */
export function BuildMartOrdersPage() {
  const { pathname } = useLocation()
  const base = martBasePath(pathname)
  const socket = useSocket()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      setItems(await fetchMyBuildMartQuotes())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your Mart orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load()
  }, [load])

  // Seller / admin updated a request: refresh right away.
  useEffect(() => {
    if (!socket) return undefined
    const onNotification = (n) => {
      if (n?.type === 'BUILDMART_QUOTE_UPDATE') load({ silent: true })
    }
    socket.on('NOTIFICATION', onNotification)
    return () => socket.off('NOTIFICATION', onNotification)
  }, [socket, load])

  // ...and when the user comes back to the app.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && load({ silent: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const counts = useMemo(() => Object.fromEntries(LEAD_TABS.map((t) => [t.id, items.filter((i) => t.match(i.status)).length])), [items])
  const visible = useMemo(() => items.filter((i) => LEAD_TABS.find((t) => t.id === tab)?.match(i.status)), [items, tab])

  return (
    <div className="-mx-4 min-h-[calc(100dvh-8rem)] space-y-4 bg-white pb-8">
      <AppStackScreenHeader title="Mart orders & updates" backTo={base} />

      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Order status">
            {LEAD_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${
                  tab === t.id ? 'bg-brand text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.label} <span className={tab === t.id ? 'text-white/80' : 'text-slate-400'}>{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </div>

        {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200/80">{error}</p> : null}

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden />
          </div>
        ) : visible.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm font-extrabold text-slate-800">
              {items.length === 0 ? 'No Mart requests yet' : 'Nothing here'}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {items.length === 0
                ? 'Request a quote for any material and you will see its progress here.'
                : 'No requests match this filter.'}
            </p>
            {items.length === 0 ? (
              <Link to={base} className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-xs font-bold text-white">
                Browse materials
              </Link>
            ) : null}
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => (
              <OrderCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
