/** Wording and colours for Mart request statuses, as seen by the buyer and by staff (admin / seller). */

export const LEAD_TABS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'In progress', match: (s) => s === 'new' || s === 'contacted' || s === 'quoted' },
  { id: 'won', label: 'Confirmed', match: (s) => s === 'won' },
  { id: 'lost', label: 'Closed', match: (s) => s === 'lost' },
]

const CUSTOMER_LABEL = {
  new: 'Request sent',
  contacted: 'Seller contacted',
  quoted: 'Quote received',
  won: 'Order confirmed',
  lost: 'Closed',
}

export const customerStatusLabel = (status) => CUSTOMER_LABEL[status] || status

export const STATUS_TONE = {
  new: 'bg-orange-50 text-orange-900 ring-orange-200/80',
  contacted: 'bg-sky-50 text-sky-900 ring-sky-200/80',
  quoted: 'bg-violet-50 text-violet-900 ring-violet-200/80',
  won: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  lost: 'bg-slate-100 text-slate-600 ring-slate-200/80',
}

export const STATUS_DOT = {
  new: 'bg-orange-400',
  contacted: 'bg-sky-500',
  quoted: 'bg-violet-500',
  won: 'bg-emerald-500',
  lost: 'bg-slate-400',
}

/** One line describing a history entry. `audience` is 'customer' (the buyer) or 'staff' (admin / seller). */
export function describeUpdate(entry, { audience, sellerName } = {}) {
  const seller = sellerName || 'The seller'
  if (audience === 'staff') {
    if (entry.status === 'new') return 'Request submitted by the customer'
    const who = entry.byName || (entry.by === 'admin' ? 'Admin' : 'Seller')
    return `Marked as ${entry.status} by ${who}`
  }
  switch (entry.status) {
    case 'new':
      return 'You sent the request'
    case 'contacted':
      return `${seller} contacted you`
    case 'quoted':
      return `${seller} sent a quote`
    case 'won':
      return 'Order confirmed'
    case 'lost':
      return 'Request closed'
    default:
      return entry.status
  }
}

export function formatUpdateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Mart base path for the app the user is in (corporate has its own shell). */
export const martBasePath = (pathname) => (pathname.startsWith('/corporate') ? '/corporate/mart' : '/app/buildmart')
