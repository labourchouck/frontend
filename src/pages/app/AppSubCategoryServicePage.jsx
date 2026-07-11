import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Wrench } from 'lucide-react'
import { getCategoryImageUrl } from '../../lib/labourCategoryDisplay.js'

export function AppSubCategoryServicePage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  const cat = location.state?.cat

  if (!cat) {
    // If user refreshes or visits directly, redirect back
    return <Navigate to="/app" replace />
  }

  const services = cat.services || []

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 truncate">{cat.name}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        <section>
          {cat.subtitle ? (
            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              {cat.subtitle}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">No description available for this sub-category.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 pl-1">
            Available Services
          </h2>
          
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Wrench className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No services found.</p>
              <p className="text-xs text-slate-400 mt-1">Check back later.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {services.map((service) => (
                <div 
                  key={service._id} 
                  className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                    {service.iconUrl ? (
                      <img 
                        src={getCategoryImageUrl({ name: service.name, imageUrl: service.iconUrl })} 
                        alt={service.name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-sm">{service.name}</h3>
                    {service.description ? (
                       <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{service.description}</p>
                    ) : null}
                  </div>
                  
                  <div className="shrink-0 text-right pr-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Base Price</p>
                    <p className="font-mono text-sm font-bold text-emerald-600 mt-0.5">₹{service.basePrice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
