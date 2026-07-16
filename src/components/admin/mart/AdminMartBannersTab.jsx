import { useState } from 'react'
import { Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '../../ui/GlassPanel.jsx'

// Mock Data
const INITIAL_BANNERS = [
  { id: 'b1', title: 'Summer Sale', subtitle: 'Up to 20% off on all items', image: 'https://via.placeholder.com/600x200', active: true },
  { id: 'b2', title: 'New Arrivals', subtitle: 'Check out our new products', image: 'https://via.placeholder.com/600x200', active: false },
]

export function AdminMartBannersTab() {
  const [banners, setBanners] = useState(INITIAL_BANNERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', image: '', active: true })

  const handleSave = (e) => {
    e.preventDefault()
    setBanners([{ ...newBanner, id: 'b' + Date.now().toString() }, ...banners])
    setIsModalOpen(false)
    setNewBanner({ title: '', subtitle: '', image: '', active: true })
  }

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Promotional Banners</h3>
          <p className="text-sm text-slate-500">Manage banners displayed on the Mart home page.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Create Banner
        </button>
      </div>

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {banners.map((banner) => (
          <GlassPanel key={banner.id} className="overflow-hidden">
            <div className="aspect-[3/1] w-full bg-slate-100">
              {banner.image ? (
                <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-bold text-slate-800">{banner.title}</p>
                <p className="text-xs text-slate-500">{banner.subtitle}</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      banner.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {banner.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </GlassPanel>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
            No banners found.
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
                <h3 className="text-lg font-bold text-slate-800">Create Banner</h3>
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
                      Title
                    </label>
                    <input
                      required
                      type="text"
                      value={newBanner.title}
                      onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                      placeholder="e.g. Winter Sale"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={newBanner.subtitle}
                      onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                      placeholder="e.g. Up to 50% off"
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
                          setNewBanner({ ...newBanner, image: URL.createObjectURL(e.target.files[0]) })
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="banner-active"
                      checked={newBanner.active}
                      onChange={(e) => setNewBanner({ ...newBanner, active: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <label htmlFor="banner-active" className="text-sm font-medium text-slate-700">
                      Make this banner active immediately
                    </label>
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
                    Save Banner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
