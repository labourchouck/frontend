import { useState } from 'react'

/**
 * Client-side pagination for a list the page already holds in full.
 * `resetKey` (e.g. the active tab + search text) sends the user back to page 1 when it changes.
 *
 * @template T
 * @param {T[]} items
 * @param {{ pageSize?: number, resetKey?: string | number }} [options]
 */
export function usePagination(items, { pageSize = 10, resetKey = '' } = {}) {
  const list = Array.isArray(items) ? items : []
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(pageSize)
  const [prevKey, setPrevKey] = useState(resetKey)

  // Filters / tabs changed: start again from the first page (adjusted during render, no extra pass).
  if (prevKey !== resetKey) {
    setPrevKey(resetKey)
    setPage(1)
  }

  const total = list.length
  const pages = Math.max(1, Math.ceil(total / size))
  const current = Math.min(page, pages) // e.g. the last item of the last page was deleted
  const start = (current - 1) * size

  return {
    pageItems: list.slice(start, start + size),
    page: current,
    pages,
    total,
    pageSize: size,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + size, total),
    setPage: (p) => setPage(Math.min(Math.max(1, p), pages)),
    setPageSize: (n) => {
      setSize(n)
      setPage(1)
    },
  }
}
