import { useEffect, useState } from 'react'
import { Loader2, FileText, AlertTriangle } from 'lucide-react'
import { apiClient } from '../../../api/http.js'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'
import { useAuth } from '../../../hooks/useAuth.js'

export function VendorTermsPage() {
  const { user } = useAuth()
  const [terms, setTerms] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTerms() {
      try {
        setLoading(true)
        const res = await apiClient.get('/terms', {
          params: { role: user?.role || 'vendor' }
        })
        setTerms(res.data.data?.content || 'No terms and conditions found for your role.')
      } catch (err) {
        console.error('Failed to load terms:', err)
        setError('Failed to load Terms and Conditions. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTerms()
  }, [user])

  return (
    <div className="w-full space-y-5 pb-28">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Legal</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">Terms & Conditions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review the legal agreement and terms of service for vendor accounts.
        </p>
      </div>

      <AppSurface>
        {loading ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium">Loading Terms...</p>
          </div>
        ) : error ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Vendor Agreement</h2>
            </div>
            
            <div 
              className="prose prose-sm prose-slate max-w-none break-words pt-2"
              dangerouslySetInnerHTML={{ __html: terms.replace(/\n/g, '<br />') }}
            />
          </div>
        )}
      </AppSurface>
    </div>
  )
}
