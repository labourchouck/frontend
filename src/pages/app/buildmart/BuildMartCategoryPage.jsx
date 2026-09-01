import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Sparkles } from 'lucide-react'
import { BuildMartProductCard } from '../../../components/buildmart/BuildMartProductCard.jsx'
import { BuildMartSearchBar } from '../../../components/buildmart/BuildMartSearchBar.jsx'
import { fetchAppMartProducts } from '../../../api/buildmartApi.js'
import { AppListSkeleton } from '../../../components/app-ui/feedback/AppListSkeleton.jsx'
import { motion, useReducedMotion } from 'framer-motion'

export function BuildMartCategoryPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [allProducts, setAllProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAppMartProducts()
      .then((res) => {
        setAllProducts(res?.data ?? res ?? [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const products = useMemo(() => {
    let list = allProducts
    if (categoryId && categoryId !== 'all') {
      list = list.filter((p) => {
        const cId = p.categoryId?._id || p.categoryId?.id || p.categoryId
        return cId === categoryId
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase()
        const brand = (p.brand || '').toLowerCase()
        const desc = (p.shortDescription || p.description || '').toLowerCase()
        return name.includes(q) || brand.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [allProducts, categoryId, searchQuery])

  const pageTitle = useMemo(() => {
    if (!categoryId || categoryId === 'all') return 'All Products'
    return categoryId.replace(/-/g, ' ')
  }, [categoryId])

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 pb-6 -mx-4 -mt-4 sm:mx-0 sm:mt-0">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-extrabold text-slate-900 capitalize">{pageTitle}</h1>
          <p className="text-[11px] font-medium text-slate-500">{products.length} products found</p>
        </div>
      </header>

      <BuildMartSearchBar onSearch={setSearchQuery} />

      <div className="px-4 mt-4">
        {loading ? (
          <AppListSkeleton rows={3} />
        ) : products.length === 0 ? (
          <motion.div
            className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm font-bold text-slate-800">No products found</p>
            <p className="mt-1 text-xs text-slate-500">Check back later for new stock.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => (
              <BuildMartProductCard key={p.id || p._id} product={p} index={i} isCompact />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
