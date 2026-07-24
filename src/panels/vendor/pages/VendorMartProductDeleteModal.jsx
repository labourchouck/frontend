import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteVendorBuildmartProduct } from '../../../api/vendorBuildmartApi.js'

const Backdrop = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm"
  />
)

export function VendorMartProductDeleteModal({ isOpen, onClose, product, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setError(null)
    setLoading(true)
    try {
      await deleteVendorBuildmartProduct(product.id || product._id)
      onSuccess(product.id || product._id)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop onClick={!loading ? onClose : undefined} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Delete Product</h2>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to delete <span className="font-bold text-slate-700">{product?.name}</span>? This action cannot be undone.
              </p>
              
              {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
