import { ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_SIZES = [10, 20, 50]

/** First, last and the pages around the current one, with gaps shown as "…". */
function pageWindow(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1])
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('gap')
    out.push(n)
  })
  return out
}

const btn =
  'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Pagination bar for admin lists: "Showing 1–10 of 57", page numbers, Prev / Next and rows per page.
 * Works with `usePagination` (spread its result) or with server-side paging (pass page, pages, total, pageSize, handlers).
 * Hidden when everything fits on one smallest page.
 */
export function AdminPagination({
  page,
  pages,
  total,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_SIZES,
  loading = false,
  className = '',
}) {
  if (!total || total <= Math.min(...pageSizeOptions)) return null
  const first = from ?? (page - 1) * pageSize + 1
  const last = to ?? Math.min(page * pageSize, total)

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 ${className}`}
      aria-label="Pagination"
      data-testid="admin-pagination"
    >
      <p className="text-xs font-medium text-slate-500">
        Showing <span className="font-bold text-slate-800">{first}–{last}</span> of <span className="font-bold text-slate-800">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button type="button" className={btn} disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {pageWindow(page, pages).map((n, i) =>
          n === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-sm font-bold text-slate-400" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`${btn} ${n === page ? '!border-brand !bg-brand !text-white' : ''} hidden sm:inline-flex`}
            >
              {n}
            </button>
          ),
        )}
        <span className="text-xs font-semibold text-slate-500 sm:hidden">
          {page} / {pages}
        </span>

        <button type="button" className={btn} disabled={page >= pages || loading} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  )
}
