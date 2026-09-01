import { BuildMartHeader } from '../../../components/buildmart/BuildMartHeader.jsx'
import { BuildMartPromoBanner } from '../../../components/buildmart/BuildMartPromoBanner.jsx'
import { BuildMartCategoryGrid } from '../../../components/buildmart/BuildMartCategoryGrid.jsx'
import { BuildMartSearchBar } from '../../../components/buildmart/BuildMartSearchBar.jsx'
import { BuildMartHomeDeals } from '../../../components/buildmart/BuildMartHomeDeals.jsx'
import { BuildMartCategorySections } from '../../../components/buildmart/BuildMartCategorySections.jsx'

export function BuildMartHomePage() {
  const handleOpenDrawer = () => {
    window.dispatchEvent(new CustomEvent('lc-open-app-drawer'))
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-white pb-6 -mx-4 -mt-4 sm:mx-0 sm:mt-0">
      <BuildMartHeader onOpenDrawer={handleOpenDrawer} />
      <BuildMartSearchBar />
      <BuildMartPromoBanner />
      <BuildMartCategoryGrid />
      <BuildMartHomeDeals />
      <BuildMartCategorySections />
    </div>
  )
}
