import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, PackageSearch, CheckCircle2, AlertCircle, X, Eye, Clock, XCircle } from 'lucide-react'
import { getAdminBuildmartProducts, reviewAdminBuildmartProduct, getAdminBuildmartProductById } from '../../api/adminBuildmartApi.js'
import { ViewMartProductModal } from '../../components/admin/ViewMartProductModal.jsx'

export function AdminMartProductReviewsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [processingId, setProcessingId] = useState(null)
  const [viewingId, setViewingId] = useState(null)
  
  const [rejectModal, setRejectModal] = useState({ open: false, productId: null, reason: '' })
  const [viewModal, setViewModal] = useState({ open: false, product: null })
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  const fetchStats = async () => {
    try {
      const [all, pending, approved, rejected] = await Promise.all([
        getAdminBuildmartProducts(''),
        getAdminBuildmartProducts('PENDING'),
        getAdminBuildmartProducts('APPROVED'),
        getAdminBuildmartProducts('REJECTED')
      ])
      setStats({
        total: all?.data?.total || all?.total || 0,
        pending: pending?.data?.total || pending?.total || 0,
        approved: approved?.data?.total || approved?.total || 0,
        rejected: rejected?.data?.total || rejected?.total || 0
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleView = async (product) => {
    const id = product._id || product.id
    setViewingId(id)
    try {
      const res = await getAdminBuildmartProductById(id)
      setViewModal({ open: true, product: res?.data || res })
    } catch (err) {
      console.error(err)
      alert('Failed to load product details')
    } finally {
      setViewingId(null)
    }
  }

  const fetchProducts = () => {
    setLoading(true)
    getAdminBuildmartProducts(filter)
      .then(res => setProducts(res?.data?.items || res?.items || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProducts()
    fetchStats()
  }, [filter])

  const handleApprove = async (id) => {
    setProcessingId(id)
    try {
      await reviewAdminBuildmartProduct(id, { status: 'APPROVED' })
      setProducts(prev => prev.filter(p => p._id !== id && p.id !== id))
      fetchStats()
    } catch (err) {
      console.error(err)
      alert('Failed to approve product')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectModal.reason.trim()) return

    setProcessingId(rejectModal.productId)
    try {
      await reviewAdminBuildmartProduct(rejectModal.productId, { 
        status: 'REJECTED', 
        rejectionReason: rejectModal.reason 
      })
      setProducts(prev => prev.filter(p => p._id !== rejectModal.productId && p.id !== rejectModal.productId))
      setRejectModal({ open: false, productId: null, reason: '' })
      fetchStats()
    } catch (err) {
      console.error(err)
      alert('Failed to reject product')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Product Reviews</h2>
          <p className="mt-1 text-sm text-slate-600">Review and approve BuildMart products uploaded by vendors.</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <PackageSearch className="h-5 w-5" />
            <span className="text-sm font-bold">Total Products</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-bold">Pending Review</span>
          </div>
          <p className="text-3xl font-black text-orange-700">{stats.pending}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">Approved</span>
          </div>
          <p className="text-3xl font-black text-emerald-700">{stats.approved}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-bold">Rejected</span>
          </div>
          <p className="text-3xl font-black text-red-700">{stats.rejected}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 text-sm font-bold transition-colors ${
              filter === status 
                ? 'border-b-2 border-brand text-brand' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500">
          <PackageSearch className="mb-4 h-12 w-12 text-slate-300" />
          <p className="text-sm font-bold">No {filter.toLowerCase()} products found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => {
            const id = product._id || product.id
            const isProcessing = processingId === id

            return (
              <div key={id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="h-40 w-full bg-slate-100">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><PackageSearch className="text-slate-300" /></div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{product.name}</h3>
                        <p className="text-sm font-medium text-slate-500">{product.brand}</p>
                      </div>
                      <button 
                        onClick={() => handleView(product)}
                        disabled={viewingId === id}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-brand/10 hover:text-brand disabled:opacity-50"
                        title="View Details"
                      >
                        {viewingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-black text-brand">{product.priceLabel}</p>
                    <div className="mt-2 text-xs font-bold text-slate-400">Category: {product.categoryId}</div>
                    
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Submitted By</p>
                      {product.vendorId ? (
                        <>
                          <p className="text-sm font-bold text-slate-800">{product.vendorId.fullName || 'Unknown Vendor'}</p>
                          <div className="mt-1 flex flex-col gap-0.5 text-xs font-medium text-slate-500">
                            {product.vendorId.phone && <span>{product.vendorId.phone}</span>}
                            {product.vendorId.email && <span>{product.vendorId.email}</span>}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm font-bold italic text-slate-500">Admin / System</p>
                      )}
                      {product.createdAt && (
                        <div className="mt-2 flex items-center gap-1.5 border-t border-slate-200/60 pt-2 text-[11px] font-semibold text-slate-400">
                          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(product.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {filter === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(id)}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-bold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectModal({ open: true, productId: id, reason: '' })}
                        disabled={isProcessing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {filter === 'REJECTED' && product.rejectionReason && (
                    <div className="rounded-lg bg-red-50 p-3">
                      <p className="text-xs font-bold text-red-800">Rejection Reason:</p>
                      <p className="mt-1 text-xs text-red-600">{product.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setRejectModal({ open: false, productId: null, reason: '' })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <h2 className="text-lg font-bold text-slate-900">Reject Product</h2>
                <button onClick={() => setRejectModal({ open: false, productId: null, reason: '' })} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleRejectSubmit} className="p-4">
                <label className="mb-2 block text-sm font-bold text-slate-700">Reason for Rejection</label>
                <textarea
                  required
                  rows={4}
                  value={rejectModal.reason}
                  onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-red-300 focus:ring-1 focus:ring-red-300"
                  placeholder="e.g. Images are blurry, price is too high..."
                />
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectModal({ open: false, productId: null, reason: '' })}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingId === rejectModal.productId}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingId === rejectModal.productId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Product Details Modal */}
      <ViewMartProductModal 
        product={viewModal.product} 
        open={viewModal.open} 
        onClose={() => setViewModal({ open: false, product: null })} 
      />
    </div>
  )
}
