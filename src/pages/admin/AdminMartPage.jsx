import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Package, Tag, List, MessageCircle, Image as ImageIcon } from 'lucide-react'
import { AdminMartCategoriesTab } from '../../components/admin/mart/AdminMartCategoriesTab.jsx'
import { AdminMartProductsTab } from '../../components/admin/mart/AdminMartProductsTab.jsx'
import { AdminMartBannersTab } from '../../components/admin/mart/AdminMartBannersTab.jsx'
import { AdminBuildMartLeadsPage as AdminMartEnquiriesTab } from './AdminMartEnquiriesPage.jsx'

const TABS = [
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'products', label: 'Products', icon: List },
  { id: 'enquiry', label: 'Enquiry', icon: MessageCircle },
  { id: 'banners', label: 'Banners', icon: ImageIcon },
]

export function AdminMartPage() {
  const [activeTab, setActiveTab] = useState('categories')
  const reduce = useReducedMotion()

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          BuildMart Management
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Manage categories, products, banners, and review incoming enquiries.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto border-b border-slate-200 scrollbar-hide">
        <div className="flex min-w-max gap-6 px-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 pb-3 text-sm font-bold transition-colors ${
                activeTab === tab.id ? 'text-brand' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeMartTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-brand"
                  initial={reduce ? false : false}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === 'categories' && <AdminMartCategoriesTab />}
        {activeTab === 'products' && <AdminMartProductsTab />}
        {activeTab === 'enquiry' && <AdminMartEnquiriesTab />}
        {activeTab === 'banners' && <AdminMartBannersTab />}
      </div>
    </div>
  )
}
