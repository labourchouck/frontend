import { useState } from 'react'
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react'

export function VendorDeleteAccountModal({ onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message || 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between p-6">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Delete Account</h2>
              <p className="mt-1 text-sm text-slate-500">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove your data, verified documents, and access.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
