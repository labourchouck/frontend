import { Truck, BadgePercent, FileText } from 'lucide-react'
import { BuildMartHeader } from '../../../components/buildmart/BuildMartHeader.jsx'
import { BuildMartPromoBanner } from '../../../components/buildmart/BuildMartPromoBanner.jsx'
import { BuildMartCategoryGrid } from '../../../components/buildmart/BuildMartCategoryGrid.jsx'
import { BuildMartHomeDeals } from '../../../components/buildmart/BuildMartHomeDeals.jsx'
import { BuildMartCategorySections } from '../../../components/buildmart/BuildMartCategorySections.jsx'

const PERKS = [
  { icon: Truck, title: 'Site delivery', sub: 'Dropped at your site' },
  { icon: BadgePercent, title: 'Bulk pricing', sub: 'Better rates on volume' },
  { icon: FileText, title: 'Get a quote', sub: 'For large orders' },
]

export function BuildMartHomePage() {
  const handleOpenDrawer = () => {
    window.dispatchEvent(new CustomEvent('lc-open-app-drawer'))
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-white pb-6 -mx-4 -mt-4 sm:mx-0 sm:mt-0">
      <BuildMartHeader onOpenDrawer={handleOpenDrawer} />
      <div className="pt-4">
        <BuildMartPromoBanner />
      </div>

      <div className="mx-4 mt-1 grid grid-cols-3 gap-2">
        {PERKS.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex flex-col items-center rounded-xl bg-emerald-50/70 px-1.5 py-2.5 text-center ring-1 ring-emerald-100">
            <Icon className="h-4 w-4 text-brand" aria-hidden />
            <span className="mt-1 text-[11px] font-extrabold leading-tight text-slate-800">{title}</span>
            <span className="mt-0.5 text-[9.5px] font-medium leading-tight text-slate-500">{sub}</span>
          </div>
        ))}
      </div>

      <h2 className="mx-4 mt-7 text-lg font-extrabold tracking-tight text-slate-900">Shop by category</h2>
      <BuildMartCategoryGrid />
      <BuildMartHomeDeals />
      <BuildMartCategorySections />
    </div>
  )
}
