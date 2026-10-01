import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LayoutGrid, Search } from 'lucide-react'
import { getGroupImageUrl } from '../../../../lib/labourCategoryDisplay.js'

function RotatingHint({ words }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length < 2) return undefined
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2600)
    return () => window.clearInterval(id)
  }, [words.length])

  const word = words[index % Math.max(words.length, 1)] || 'a skilled worker'

  return (
    <span className="relative inline-flex min-w-0 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          className="truncate font-semibold text-slate-700"
          initial={reduce ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: -12, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          &lsquo;{word}&rsquo;
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/**
 * Search + trade tabs; sticks to the top of the screen once the location
 * header scrolls away. `activeId` null means the "All" feed.
 */
export function HomeStickyBar({ tradeGroups, activeId, onSelect, searchHints, onSearch }) {
  const tabsRef = useRef(null)

  useEffect(() => {
    const el = tabsRef.current?.querySelector('[aria-selected="true"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeId])

  const tabs = [{ _id: null, name: 'All' }, ...tradeGroups]

  return (
    <div className="sticky top-0 z-30 bg-brand px-4 pb-0 pt-1 shadow-[0_8px_16px_-14px_rgba(6,78,59,0.8)]">
      <button
        type="button"
        onClick={onSearch}
        className="flex h-11 w-full items-center gap-2.5 rounded-xl bg-white px-3.5 text-left text-sm shadow-sm transition active:scale-[0.99]"
        aria-label="Search for a service"
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden />
        <span className="flex min-w-0 items-center gap-1 text-slate-400">
          <span className="shrink-0">Search for</span>
          <RotatingHint words={searchHints} />
        </span>
      </button>

      <div
        ref={tabsRef}
        className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Trades"
      >
        {tabs.map((g) => {
          const id = g._id == null ? null : String(g._id)
          const active = id === activeId
          return (
            <button
              key={id ?? 'all'}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(id)}
              className="relative flex min-w-[60px] shrink-0 flex-col items-center gap-1 px-1.5 pb-2.5 pt-1"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition ${
                  active ? 'bg-white ring-2 ring-white' : 'bg-white/15 ring-1 ring-white/25'
                }`}
              >
                {id == null ? (
                  <LayoutGrid className={`h-5 w-5 ${active ? 'text-brand' : 'text-white'}`} aria-hidden />
                ) : (
                  <img src={getGroupImageUrl(g)} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </span>
              <span
                className={`whitespace-nowrap text-[11px] leading-tight ${
                  active ? 'font-extrabold text-white' : 'font-semibold text-white/80'
                }`}
              >
                {g.name}
              </span>
              {active ? (
                <motion.span
                  layoutId="home-trade-tab-underline"
                  className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-white"
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
