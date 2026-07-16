import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Search, RefreshCw, Edit2, Trash2 } from 'lucide-react'
import { fetchAdminMartBanners, createAdminMartBanner, deleteAdminMartBanner, patchAdminMartBanner } from '../../api/adminBuildmartApi.js'
import { ApiError } from '../../api/http.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { EditMartBannerModal } from '../../components/admin/EditMartBannerModal.jsx'

export function AdminMartBannersPage() {
  const reduce = useReducedMotion()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [editItem, setEditItem] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminMartBanners()
      setItems(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => { load() }, [load])
  
  async function handleDelete(id) {
    if (!window.confirm('Delete banner?')) return
    try {
      await deleteAdminMartBanner(id)
      load()
    } catch(e) {
      alert(e.message)
    }
  }

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div><h2 className="text-xl font-extrabold text-slate-900">Mart Banners</h2></div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary px-3 py-2"><RefreshCw className="h-4 w-4" /></button>
          <AppPrimaryButton onClick={() => setIsAddOpen(true)} className="py-2"><Plus className="h-4 w-4 mr-1" /> Add Banner</AppPrimaryButton>
        </div>
      </div>
      <GlassPanel className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Label</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => {
              const bannerId = item._id || item.id;
              return (
              <tr key={bannerId} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{item.id}</td>
                <td className="px-4 py-3 text-slate-600">{item.label}</td>
                <td className="px-4 py-3">
                  <button 
                    onClick={async () => {
                      try {
                        await patchAdminMartBanner(bannerId, { active: !item.active });
                        load();
                      } catch(e) {
                        alert('Failed to patch: ' + e.message);
                      }
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${item.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {item.active !== false ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditItem(item)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(bannerId)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </GlassPanel>
      
      {(editItem || isAddOpen) && (
        <EditMartBannerModal 
          item={editItem}
          open={true}
          onClose={() => { setEditItem(null); setIsAddOpen(false); }}
          onSaved={() => { setEditItem(null); setIsAddOpen(false); load(); }}
        />
      )}
    </motion.div>
  )
}
