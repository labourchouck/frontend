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
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 overflow-hidden overscroll-none">
      <div className="shrink-0 flex items-center justify-between bg-slate-50 px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <Link to="/vendor/mart" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">My Uploads</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Products ({products.length})</p>
          </div>
        </div>
        <Link to="/vendor/mart" className="flex h-10 w-10 items-center justify-center rounded-full bg-bm-terracotta text-white shadow-md transition hover:bg-[#a63a15]">
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
                <GlassPanel key={product._id || product.id} className="overflow-hidden p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300"><PackageSearch /></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                          <p className="text-xs font-medium text-slate-500">{product.brand}</p>
                        </div>
                        {product.status === 'APPROVED' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        {product.status === 'PENDING' && <Clock className="h-5 w-5 text-amber-500" />}
                        {product.status === 'REJECTED' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      </div>
                      <p className="mt-2 text-sm font-black text-bm-terracotta">{product.priceLabel}</p>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            product.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            product.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {product.status || 'PENDING'}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {product.categoryId}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewProduct(product)} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditProduct(product)} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteProduct(product)} className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {product.status === 'REJECTED' && product.rejectionReason && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                      <p className="text-xs font-bold text-red-800">Admin Feedback:</p>
                      <p className="mt-1 text-xs text-red-600">{product.rejectionReason}</p>
                    </div>
                  )}
                </GlassPanel>
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
