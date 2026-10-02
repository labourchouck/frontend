import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { fetchAppMartProducts, fetchAppMartCategories } from '../../api/buildmartApi.js'
import { MartProductTile } from './MartProductTile.jsx'

export function BuildMartCategorySections() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
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
        console.error('Failed to load category sections:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Group products by category ID
  const categorySections = useMemo(() => {
    if (!categories.length || !products.length) return []

    return categories.map((cat) => {
      const catId = cat.id || cat._id
      const catProducts = products.filter((p) => {
        const pCatId = p.categoryId?._id || p.categoryId?.id || p.categoryId
        return pCatId === catId
      })

      return {
        ...cat,
        id: catId,
        products: catProducts,
      }
    }).filter((cat) => cat.products.length > 0)
  }, [categories, products])

  if (loading) {
    return (
      <div className="mx-4 space-y-8 pb-10">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="flex gap-3 overflow-hidden">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-52 w-[170px] shrink-0 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (categorySections.length === 0) return null

  return (
    <div className="space-y-8 pb-2">
      {categorySections.map((section) => {
        return (
          <section key={section.id} className="mx-4">
            {/* Category Header */}
            <div className="mb-3 flex items-center gap-2.5">
              {section.icon || section.image ? (
                <img
                  src={section.icon || section.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-xl bg-[#eef8f8] object-cover ring-1 ring-slate-200/70"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold leading-tight tracking-tight text-slate-900">
                  {section.label || section.name}
                </h2>
                <p className="text-[11px] font-medium text-slate-500">
                  {section.products.length} {section.products.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              <Link
                to={`/app/buildmart/category/${section.id}`}
                className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand"
              >
                <span>See all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Category Products Horizontal Scroll */}
            <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {section.products.map((product) => (
                <MartProductTile key={product.id || product._id} product={product} rail />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
