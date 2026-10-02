import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { formatBuildMartPrice, getBuildMartOffer } from '../../data/buildmartCatalog.js'

export function BuildMartVariantPicker({ variants, selectedId, onSelect }) {
  const reduce = useReducedMotion()

  return (
    <div
      className="-mx-4 -mt-2 flex gap-2.5 overflow-x-auto px-4 pb-1 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="listbox"
      aria-label="Product variants"
    >
      {variants.map((v) => {
        const active = selectedId === v.id
        const offer = getBuildMartOffer(v)
        return (
          <motion.button
            key={v.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(v.id)}
            className={`relative min-w-[112px] shrink-0 rounded-2xl px-3.5 py-2.5 text-left ring-1 transition ${
              active ? 'bg-emerald-50 ring-2 ring-brand' : 'bg-white ring-slate-200 hover:ring-brand/40'
            }`}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            {active ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                <Check className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
            <span className="block text-sm font-extrabold text-slate-900">{v.label}</span>
            <span className="mt-0.5 flex items-baseline gap-1">
              <span className={`text-xs font-bold ${active ? 'text-brand' : 'text-slate-700'}`}>
                {formatBuildMartPrice(v.retailPrice, v.unit)}
              </span>
              {offer.hasOffer ? (
                <span className="text-[10px] font-semibold text-slate-400 line-through">{offer.mrpLabel}</span>
              ) : null}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
