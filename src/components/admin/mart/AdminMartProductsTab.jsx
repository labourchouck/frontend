import { useState } from 'react'
import { Plus, Search, Package, Edit, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '../../ui/GlassPanel.jsx'

// Mock Data
const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'UltraTech Cement 50kg', category: 'Cement', price: '₹400', stock: 'In Stock' },
  { id: 'p2', name: 'Tata Tiscon 12mm TMT', category: 'Steel & TMT', price: '₹75/kg', stock: 'Low Stock' },
  { id: 'p3', name: 'Red Bricks (Premium)', category: 'Bricks & Blocks', price: '₹8/piece', stock: 'In Stock' },
]

export function AdminMartProductsTab() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProd, setNewProd] = useState({ name: '', category: 'Cement', price: '', stock: 'In Stock', image: '', description: '' })
  
  const [editProd, setEditProd] = useState(null)
  const [deleteProd, setDeleteProd] = useState(null)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSave = (e) => {
    e.preventDefault()
    setProducts([{ ...newProd, id: 'p' + Date.now().toString() }, ...products])
    setIsModalOpen(false)
    setNewProd({ name: '', category: 'Cement', price: '', stock: 'In Stock', image: '', description: '' })
  }

  const handleEditSave = (e) => {
    e.preventDefault()
    setProducts(products.map((p) => (p.id === editProd.id ? editProd : p)))
    setEditProd(null)
  }

  const handleDelete = () => {
    setProducts(products.filter((p) => p.id !== deleteProd.id))
    setDeleteProd(null)
  }

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or categories..."
            className="w-full rounded-xl border border-slate-200/60 bg-white/80 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Create Product
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="transition hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-800">{prod.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{prod.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{prod.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        prod.stock === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {prod.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setEditProd({ ...prod })}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteProd(prod)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-800">Create Product</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Product Name
                    </label>
                    <input
                      required
                      type="text"
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      placeholder="e.g. 50kg Cement Bag"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewProd({ ...newProd, image: URL.createObjectURL(e.target.files[0]) })
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Category
                      </label>
                      <select
                        value={newProd.category}
                        onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      >
                        <option>Cement</option>
                        <option>Steel & TMT</option>
                        <option>Bricks & Blocks</option>
                        <option>Sand & Aggregates</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Price
                      </label>
                      <input
                        required
                        type="text"
                        value={newProd.price}
                        onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                        placeholder="e.g. ₹400/bag"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Stock Status
                    </label>
                    <select
                      value={newProd.stock}
                      onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option>In Stock</option>
                      <option>Low Stock</option>
                      <option>Out of Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={newProd.description || ''}
                      onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      placeholder="Brief description about the product..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editProd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditProd(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-800">Edit Product</h3>
                <button
                  type="button"
                  onClick={() => setEditProd(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Product Name
                    </label>
                    <input
                      required
                      type="text"
                      value={editProd.name}
                      onChange={(e) => setEditProd({ ...editProd, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setEditProd({ ...editProd, image: URL.createObjectURL(e.target.files[0]) })
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Category
                      </label>
                      <select
                        value={editProd.category}
                        onChange={(e) => setEditProd({ ...editProd, category: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      >
                        <option>Cement</option>
                        <option>Steel & TMT</option>
                        <option>Bricks & Blocks</option>
                        <option>Sand & Aggregates</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Price
                      </label>
                      <input
                        required
                        type="text"
                        value={editProd.price}
                        onChange={(e) => setEditProd({ ...editProd, price: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Stock Status
                    </label>
                    <select
                      value={editProd.stock}
                      onChange={(e) => setEditProd({ ...editProd, stock: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option>In Stock</option>
                      <option>Low Stock</option>
                      <option>Out of Stock</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={editProd.description || ''}
                      onChange={(e) => setEditProd({ ...editProd, description: e.target.value })}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setEditProd(null)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteProd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDeleteProd(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-5 shadow-2xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-800">Delete Product</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete <span className="font-semibold">{deleteProd.name}</span>? This action cannot be undone.
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteProd(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
