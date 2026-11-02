import { STATUS_DOT, describeUpdate, formatUpdateTime } from '../../lib/buildmartLeadStatus.js'

/**
 * Vertical list of a Mart request's updates, oldest first.
 * @param {{ history: Array<{status:string, note?:string, by?:string, byName?:string, at?:string}>, audience?: 'customer'|'staff', sellerName?: string }} props
 */
export function LeadTimeline({ history = [], audience = 'customer', sellerName }) {
  if (!history.length) return null
  return (
    <ol className="space-y-0">
      {history.map((entry, i) => {
        const last = i === history.length - 1
        return (
          <li key={`${entry.status}-${entry.at}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
            {!last ? <span className="absolute left-[5px] top-3.5 h-[calc(100%-0.25rem)] w-px bg-slate-200" aria-hidden /> : null}
            <span className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ring-2 ring-white ${STATUS_DOT[entry.status] || 'bg-slate-400'}`} aria-hidden />
            <div className="min-w-0">
              <p className={`text-[13px] leading-snug ${last ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                {describeUpdate(entry, { audience, sellerName })}
              </p>
              {entry.note && !(entry.status === 'new' && entry.note === 'Request submitted') ? <p className="mt-0.5 text-xs font-medium text-slate-600">“{entry.note}”</p> : null}
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">{formatUpdateTime(entry.at)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
