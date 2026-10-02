import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { fetchAppMartProducts, fetchAppMartCategories } from '../../api/buildmartApi.js'
import { MartProductTile } from './MartProductTile.jsx'

export function BuildMartHomeDeals() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAppMartProducts().catch(() => ({ data: [] })),
      fetchAppMartCategories().catch(() => ({ data: [] }))
    ])
      .then(([prodRes, catRes]) => {
        const prodData = prodRes?.data ?? prodRes ?? []
        const catData = catRes?.data ?? catRes ?? []
        
        if (Array.isArray(prodData)) {
          setProducts(prodData.filter(p => p.active !== false))
        }
        if (Array.isArray(catData)) {
          setCategories(catData.filter(c => c.active !== false))
        }
      })
      .catch((err) => {
        console.error('Failed to load featured products and categories:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === 'all') return products
    return products.filter((p) => {
      const cId = p.categoryId?._id || p.categoryId?.id || p.categoryId
      return cId === selectedCategoryId
    })
  }, [products, selectedCategoryId])

  if (loading) {
    return (
      <div className="mx-4 mt-8 pb-10">
        <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-60 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 flex gap-2 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="mt-4 flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 w-[175px] shrink-0 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) return null

  return (
    <section className="mx-4 mt-8 pb-4">
      {/* Section Header */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Featured Products
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {filteredProducts.length} products available for direct delivery
          </p>
        </div>
        <Link 
          to={`/app/buildmart/category/${selectedCategoryId}`} 
          className="flex items-center text-xs font-bold text-brand"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              selectedCategoryId === 'all'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => {
            const catId = cat.id || cat._id
            const isSelected = selectedCategoryId === catId
            return (
              <button
                key={catId}
                onClick={() => setSelectedCategoryId(catId)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="leading-none">{cat.label || cat.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Products Horizontal Scroll */}
      {filteredProducts.length === 0 ? (
        <div className="my-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-slate-400" />
          <p className="mt-1.5 text-xs font-bold text-slate-700">No products found in this category</p>
          <button
            onClick={() => setSelectedCategoryId('all')}
            className="mt-2 text-xs font-bold text-emerald-600 underline"
          >
            View all products
          </button>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredProducts.map((product) => (
            <MartProductTile key={product.id || product._id} product={product} rail />
          ))}
        </div>
      )}
    </section>
  )
}
