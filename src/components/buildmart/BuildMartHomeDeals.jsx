import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Star, ChevronRight, Layers, Sparkles } from 'lucide-react'
import { fetchAppMartProducts, fetchAppMartCategories } from '../../api/buildmartApi.js'
import { formatBuildMartPrice } from '../../data/buildmartCatalog.js'

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
    <section className="mx-4 mt-8 pb-12">
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
          className="flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700"
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
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
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
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
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
        <div className="flex w-full snap-x snap-mandatory items-stretch gap-3.5 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
          {filteredProducts.map((product) => {
            const primaryVariant = product.variants?.[0]
            const imageUrl = product.images?.[0] || product.image

            return (
              <Link
                key={product.id || product._id}
                to={`/app/buildmart/product/${product.id || product._id}`}
                className="group flex w-[175px] min-w-[175px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                {/* Top Row: Brand & Availability / Rating */}
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  {product.brand ? (
                    <span className="truncate rounded-md bg-slate-100 px-1.5 py-0.5 font-bold uppercase tracking-wider text-slate-700">
                      {product.brand}
                    </span>
                  ) : <span />}

                  {product.supplier?.rating ? (
                    <span className="flex items-center gap-0.5 font-extrabold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {product.supplier.rating}
                    </span>
                  ) : product.variantCount > 1 ? (
                    <span className="flex items-center gap-0.5 font-bold text-slate-500">
                      <Layers className="h-3 w-3" />
                      {product.variantCount} var
                    </span>
                  ) : null}
                </div>

                {/* Product Image */}
                <div className="relative my-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50/80 p-2">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-contain mix-blend-multiply transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                {/* Delivery Info from API */}
                {product.deliveryInfo && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate">{product.deliveryInfo}</span>
                  </div>
                )}

                {/* Product Name */}
                <div className="mt-1.5 space-y-1">
                  <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 group-hover:text-emerald-700">
                    {product.name}
                  </h3>

                  {/* Price Display */}
                  <div className="pt-0.5">
                    <div className="text-sm font-black text-slate-900">
                      {primaryVariant && primaryVariant.retailPrice != null
                        ? formatBuildMartPrice(primaryVariant.retailPrice, primaryVariant.unit)
                        : product.priceLabel || 'Price on request'}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-slate-900 py-1.5 text-xs font-bold text-white transition group-hover:bg-emerald-600 shadow-xs">
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
