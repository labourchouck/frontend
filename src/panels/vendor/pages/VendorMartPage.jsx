import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, PackageSearch, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { AppSectionHeader } from '../../../components/app-ui/layout/AppSectionHeader.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { fetchAppMartCategories } from '../../../api/buildmartApi.js'

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

function CategoryCard({ cat }) {
  const [imgError, setImgError] = useState(false);
  const imgSource = cat.icon || cat.imageUrl || cat.image;
  const displayName = cat.label || cat.name || 'Category';
  const navigate = useNavigate();

  return (
    <motion.div variants={itemVariants}>
      <Link 
        to={`/vendor/mart/category/${encodeURIComponent(cat._id || cat.id || cat.name || cat.label || 'unknown')}`}
        className="group flex h-full cursor-pointer flex-col items-center gap-2 transition-transform duration-200 hover:-translate-y-1 hover:scale-105 active:scale-95"
      >
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-white shadow-md shadow-slate-200/50 transition-all duration-300 group-hover:border-bm-orange/20 group-hover:shadow-xl group-hover:shadow-bm-orange/20 sm:h-24 sm:w-24">
          {imgSource && !imgError ? (
            <img 
              src={imgSource} 
              alt={displayName} 
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-orange-50 text-bm-terracotta">
              <PackageSearch className="h-8 w-8 opacity-70" />
            </div>
          )}
        </div>
        <div className="flex h-8 w-full items-start justify-center px-1">
          <p className="line-clamp-2 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-slate-700 transition-colors group-hover:text-bm-terracotta sm:text-[11px]">
            {displayName}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function VendorMartPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const catName = cat.label || cat.name || '';
      return catName.toLowerCase().includes(searchQuery.toLowerCase());
    })
  }, [categories, searchQuery])

  useEffect(() => {
    fetchAppMartCategories()
      .then(res => {
        setCategories(res?.categories || res?.data || res || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="h-[100dvh] overflow-y-auto overscroll-none buildmart-gradient-soft pb-20"
    >
      <VendorPageLayout>
        <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-b from-[#7a280e] to-[#c45c26] px-4 pb-8 pt-8 text-white shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <Link to="/vendor" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white shadow-sm">App Mart</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200">Categories</p>
            </div>
          </div>
          <Link to="/vendor/mart/products" className="absolute right-4 top-10 flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20">
            My Uploads
          </Link>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-lg outline-none ring-2 ring-white/0 placeholder:text-slate-400 focus:ring-orange-300/80"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </div>

        <section className="pb-8 pt-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm font-bold text-slate-400">
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm font-bold text-slate-400">
              <PackageSearch className="h-8 w-8 opacity-20" />
              <p>No categories found.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
            >
              {filteredCategories.map((cat, i) => (
                <CategoryCard key={cat.id || cat.name || i} cat={cat} />
              ))}
            </motion.div>
          )}
        </section>
      </VendorPageLayout>
    </motion.div>
  )
}
