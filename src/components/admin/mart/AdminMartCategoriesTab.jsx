import { useState } from 'react'
import { Plus, Search, Tag, Edit, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '../../ui/GlassPanel.jsx'

// Mock Data
const INITIAL_CATEGORIES = [
  { id: '1', name: 'Cement', image: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Steel & TMT', image: 'https://via.placeholder.com/150' },
  { id: '3', name: 'Bricks & Blocks', image: 'https://via.placeholder.com/150' },
]

export function AdminMartCategoriesTab() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', image: '' })
  
  const [editCat, setEditCat] = useState(null)
  const [deleteCat, setDeleteCat] = useState(null)

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSave = (e) => {
    e.preventDefault()
    setCategories([{ ...newCat, id: Date.now().toString() }, ...categories])
    setIsModalOpen(false)
    setNewCat({ name: '', image: '' })
  }

  const handleEditSave = (e) => {
    e.preventDefault()
    setCategories(categories.map((c) => (c.id === editCat.id ? editCat : c)))
    setEditCat(null)
  }

  const handleDelete = () => {
    setCategories(categories.filter((c) => c.id !== deleteCat.id))
    setDeleteCat(null)
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
            placeholder="Search categories..."
            className="w-full rounded-xl border border-slate-200/60 bg-white/80 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Create Category
        </button>
      </div>

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cat) => (
          <GlassPanel key={cat.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <Tag className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-500">ID: {cat.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setEditCat({ ...cat })}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setDeleteCat(cat)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </GlassPanel>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
            No categories found.
          </div>
        )}
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
                <h3 className="text-lg font-bold text-slate-800">Create Category</h3>
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
                      Category Name
                    </label>
                    <input
                      required
                      type="text"
                      value={newCat.name}
                      onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                      placeholder="e.g. Plumbing Supplies"
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
                          setNewCat({ ...newCat, image: URL.createObjectURL(e.target.files[0]) })
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
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
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editCat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditCat(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-800">Edit Category</h3>
                <button
                  type="button"
                  onClick={() => setEditCat(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Category Name
                    </label>
                    <input
                      required
                      type="text"
                      value={editCat.name}
                      onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
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
                          setEditCat({ ...editCat, image: URL.createObjectURL(e.target.files[0]) })
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setEditCat(null)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    Update Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteCat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDeleteCat(null)}
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
              <h3 className="mb-1 text-lg font-bold text-slate-800">Delete Category</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete <span className="font-semibold">{deleteCat.name}</span>? This action cannot be undone.
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCat(null)}
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
