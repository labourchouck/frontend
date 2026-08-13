import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, FileText, AlertTriangle } from 'lucide-react'
import { apiClient } from '../../api/http.js'
import { useAuth } from '../../hooks/useAuth.js'

export function AppPrivacyPolicyPage() {
  const { user } = useAuth()
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPolicy() {
      try {
        setLoading(true)
        const res = await apiClient.get('/privacy-policy', {
          params: { role: user?.role }
        })
        setPolicy(res.data.data?.content || 'No privacy policy found for your role.')
      } catch (err) {
        console.error('Failed to load privacy policy:', err)
        setError('Failed to load Privacy Policy. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    if (user?.role) {
      fetchPolicy()
    }
  }, [user])

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Content */}
      <div className="flex-1 p-5">
        {loading ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium">Loading Privacy Policy...</p>
          </div>
        ) : error ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Data & Privacy</h2>
            </div>
            
            <div 
              className="prose prose-sm prose-slate max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: policy.replace(/\n/g, '<br />') }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
