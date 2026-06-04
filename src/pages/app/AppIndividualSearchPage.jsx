import { useEffect, useState } from 'react'
import { fetchLabourCategoriesGrouped } from '../../api/labourCategoriesApi.js'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { IndividualCategorySearchPanel } from '../../components/app/individual/IndividualCategorySearchPanel.jsx'

export function AppIndividualSearchPage() {
  const [tradeGroups, setTradeGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchLabourCategoriesGrouped()
      .then((res) => {
        if (cancelled) return
        const groups = res.data?.groups ?? []
        const meta = res.data?.meta ?? {}
        const tradeKind = meta.tradeKind ?? 'trade'
        setTradeGroups(groups.filter((g) => g.kind === tradeKind && (g.categories?.length ?? 0) > 0))
      })
      .catch(() => {
        if (!cancelled) setTradeGroups([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="-mx-4 flex flex-col bg-white">
      <AppStackScreenHeader title="Search" backTo="/app" />
      <IndividualCategorySearchPanel tradeGroups={tradeGroups} groupsLoading={loading} />
    </div>
  )
}
