import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Truck, Star, Layers } from 'lucide-react'
import { fetchAppMartProducts, fetchAppMartCategories } from '../../api/buildmartApi.js'
import { formatBuildMartPrice } from '../../data/buildmartCatalog.js'

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
    <div className="space-y-8 pb-16">
      {categorySections.map((section) => {
        return (
          <section key={section.id} className="mx-4">
            {/* Category Header */}
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  {section.label || section.name}
                </h2>
                <p className="text-[11px] font-medium text-slate-500">
                  {section.products.length} items available
                </p>
              </div>

              <Link
                to={`/app/buildmart/category/${section.id}`}
                className="flex items-center gap-0.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span>See all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Category Products Horizontal Scroll */}
            <div className="flex w-full snap-x snap-mandatory items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
              {section.products.map((product) => {
                const primaryVariant = product.variants?.[0]
                const imageUrl = product.images?.[0] || product.image

                return (
                  <Link
                    key={product.id || product._id}
                    to={`/app/buildmart/product/${product.id || product._id}`}
                    className="group flex w-[175px] min-w-[175px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    {/* Top Row: Brand & Rating / Variant count */}
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

                    {/* Delivery Info */}
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
          </section>
        )
      })}
    </div>
  )
}
