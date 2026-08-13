import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, HelpCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { faqApi } from '../../../api/faqApi.js'
import { AppSurface } from '../../../components/app-ui/cards/AppSurface.jsx'

export function VendorFaqPage() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    async function fetchFaqs() {
      try {
        setLoading(true)
        const res = await faqApi.getFaqs()
        setFaqs(res.data.faqs || [])
      } catch (err) {
        console.error('Failed to load FAQs:', err)
        setError('Failed to load FAQs. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchFaqs()
  }, [])

  return (
    <div className="w-full space-y-5 pb-28">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Help Center</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">FAQs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Frequently asked questions to help you navigate the platform.
        </p>
      </div>

      <AppSurface>
        {loading ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium">Loading FAQs...</p>
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
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Common Questions</h2>
            </div>
            
            {faqs.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No FAQs available right now.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {faqs.map((faq) => {
                  const isOpen = openId === faq._id
                  return (
                    <div 
                      key={faq._id}
                      className="overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200/60 transition hover:ring-brand/30"
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : faq._id)}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left outline-none"
                      >
                        <span className="text-sm font-semibold text-slate-800">{faq.question}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                            isOpen ? 'rotate-180 text-brand' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="border-t border-slate-200/60 p-4 pt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </AppSurface>
    </div>
  )
}
