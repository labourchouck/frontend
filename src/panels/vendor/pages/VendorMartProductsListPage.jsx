import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, PackageSearch, AlertCircle, CheckCircle2, Clock, Eye, Edit, Trash2 } from 'lucide-react'
import { VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { getVendorBuildmartProducts } from '../../../api/vendorBuildmartApi.js'
import { VendorMartProductViewModal } from './VendorMartProductViewModal.jsx'
import { VendorMartProductEditModal } from './VendorMartProductEditModal.jsx'
import { VendorMartProductDeleteModal } from './VendorMartProductDeleteModal.jsx'

export function VendorMartProductsListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewProduct, setViewProduct] = useState(null)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)

  useEffect(() => {
    getVendorBuildmartProducts()
      .then(res => {
        setProducts(res?.data?.items || res?.items || res || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col buildmart-gradient-soft overflow-hidden overscroll-none">
      <div className="shrink-0 flex items-center justify-between px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <Link to="/vendor/mart" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 border border-slate-200/80">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">My Uploads</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Products ({products.length})</p>
          </div>
        </div>
        <Link to="/vendor/mart" className="flex h-10 w-10 items-center justify-center rounded-2xl buildmart-gradient text-white buildmart-glow shadow-md transition hover:opacity-90">
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-20 pt-2">
        <VendorPageLayout>
          <section className="px-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-bm-terracotta" />
            </div>
          ) : products.length === 0 ? (
            <GlassPanel className="flex flex-col items-center justify-center py-12 text-center">
              <PackageSearch className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No products uploaded yet.</p>
              <p className="mt-1 text-xs text-slate-400">Go to categories to upload a new product.</p>
            </GlassPanel>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div key={product._id || product.id} className="rounded-3xl border border-orange-100/90 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-2xl bg-slate-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300"><PackageSearch /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 truncate pr-2">
                          <h3 className="text-sm font-extrabold text-slate-900 truncate">{product.name}</h3>
                          <p className="text-xs font-semibold text-slate-500 truncate">{product.brand}</p>
                        </div>
                        {product.status === 'APPROVED' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                        {product.status === 'PENDING' && <Clock className="h-5 w-5 text-amber-500 shrink-0" />}
                        {product.status === 'REJECTED' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
                      </div>
                      <p className="mt-2 text-sm font-extrabold text-bm-terracotta">{product.priceLabel}</p>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            product.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' :
                            product.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-1 ring-red-200/80' :
                            'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80'
                          }`}>
                            {product.status || 'PENDING'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setViewProduct(product)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-100">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditProduct(product)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-100">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteProduct(product)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-200/80 transition hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {product.status === 'REJECTED' && product.rejectionReason && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-3">
                      <p className="text-xs font-extrabold text-red-800">Admin Feedback:</p>
                      <p className="mt-1 text-xs text-red-600 font-medium">{product.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        </VendorPageLayout>
      </div>

      <VendorMartProductViewModal isOpen={!!viewProduct} onClose={() => setViewProduct(null)} product={viewProduct} />
      <VendorMartProductEditModal 
        isOpen={!!editProduct} 
        onClose={() => setEditProduct(null)} 
        product={editProduct} 
        onSuccess={(updatedProduct) => {
          setProducts(prev => prev.map(p => (p.id || p._id) === (updatedProduct.id || updatedProduct._id) ? updatedProduct : p))
        }}
      />
      <VendorMartProductDeleteModal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        product={deleteProduct}
        onSuccess={(deletedId) => {
          setProducts(prev => prev.filter(p => (p.id || p._id) !== deletedId))
        }}
      />
    </div>
  )
}
