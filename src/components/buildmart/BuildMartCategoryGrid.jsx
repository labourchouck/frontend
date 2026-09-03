import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAppMartCategories } from '../../api/buildmartApi.js'

export function BuildMartCategoryGrid() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppMartCategories()
      .then((res) => {
        const data = res?.data ?? res ?? []
        setCategories(data.filter(c => c.active !== false))
      })
      .catch((err) => console.error('Failed to load categories:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-4 mt-6 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="aspect-square w-full rounded-2xl bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-4 mt-6 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
      {categories.map((category) => (
        <Link
          to={`/app/buildmart/category/${category.id || category._id}`}
          key={category.id || category._id}
          className="group flex flex-col items-center gap-2 outline-none"
        >
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-[#eef8f8] transition group-hover:shadow-md">
            {/* Hardcoded bulk prices for demonstration, can be updated via API later */}
            {(category.label === 'Cement' || category.label === 'Tiling') && (
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-md bg-yellow-400 px-1.5 py-0.5 text-[8px] font-extrabold text-yellow-900 shadow-sm">
                Bulk Prices
              </div>
            )}
            <img
              src={category.icon || category.image}
              alt={category.label}
              className="h-full w-full object-cover mix-blend-multiply"
              loading="lazy"
            />
          </div>
          <span className="text-center text-[10px] font-bold leading-tight text-slate-800">
            {category.label || category.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
