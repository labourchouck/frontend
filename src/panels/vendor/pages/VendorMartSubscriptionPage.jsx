import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, ShoppingCart, Sparkles, ChevronRight, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { VendorPageLayout } from '../../../components/vendor/VendorPageLayout.jsx'

import { vendorApi } from '../../../api/vendorApi.js'

export function VendorMartSubscriptionPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    vendorApi.getSubscriptionPlans()
      .then(res => {
        const fetchedPlans = res?.data?.plans || res?.plans || []
        setPlans(fetchedPlans)
        if (fetchedPlans.length > 0) {
          const recommended = fetchedPlans.find(p => p.recommended)
          setSelectedPlan(recommended ? recommended._id : fetchedPlans[0]._id)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSubscribe = async (plan) => {
    setIsProcessing(true)
    try {
      await vendorApi.subscribeToPlan(plan._id)
      showToast(`Successfully subscribed to ${plan.name}!`)
      setTimeout(() => {
        navigate('/vendor/mart', { replace: true })
      }, 1000)
    } catch (err) {
      console.error(err)
      showToast('Failed to subscribe. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="h-[100dvh] overflow-y-auto overscroll-none buildmart-gradient-soft pb-20"
    >
      <VendorPageLayout>
        {/* Header Section */}
        <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-[#7a280e] to-[#c45c26] px-4 pb-12 pt-8 text-white shadow-2xl">
          
          <div className="relative mb-6 flex items-center justify-between">
            <Link to="/vendor" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 ring-1 ring-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-tr from-amber-400 to-orange-500 p-1 shadow-lg shadow-orange-500/40">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#7a280e]/40 backdrop-blur-md">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-black text-white tracking-tight">Unlock App Mart</h1>
            <p className="text-sm font-medium text-slate-300 max-w-[280px]">
              Subscribe to access exclusive wholesale deals on materials, tools, and safety gear.
            </p>
          </div>
          
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-20 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
        </div>

        {/* Pricing Cards Section */}
        <section className="relative z-10 -mt-6 px-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7a280e] border-t-transparent"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex justify-center py-10 text-slate-500 font-medium">
              No subscription plans available at the moment.
            </div>
          ) : (
            <AnimatePresence>
              {plans.map((plan, index) => {
                const isSelected = selectedPlan === plan._id
                return (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    onClick={() => setSelectedPlan(plan._id)}
                    className={`relative overflow-hidden rounded-3xl p-0.5 transition-all duration-300 ${isSelected ? 'scale-[1.02] shadow-xl' : 'scale-100 shadow-md hover:scale-[1.01]'}`}
                  >
                  {/* Outer glowing border for selected state */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-[#7a280e] to-[#c45c26] opacity-100 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                  
                  {plan.recommended && (
                    <div className="absolute top-0 right-6 rounded-b-lg bg-gradient-to-r from-[#c45c26] to-[#7a280e] px-3 py-1 shadow-md z-20">
                      <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white">
                        <Sparkles className="h-3 w-3" /> Most Popular
                      </p>
                    </div>
                  )}

                  <div className={`relative flex h-full flex-col justify-between rounded-[1.4rem] bg-white p-6 z-10 ${isSelected ? '' : 'ring-1 ring-slate-200'}`}>
                    
                    {/* Card Header */}
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h3 className={`text-lg font-black uppercase tracking-wide ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">{plan.description}</p>
                      </div>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${isSelected ? 'border-transparent bg-[#c45c26]' : 'border-slate-300 bg-transparent'}`}>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6 flex items-end gap-1">
                      <span className={`text-4xl font-black ${isSelected ? 'text-[#c45c26]' : 'text-slate-900'}`}>
                        {plan.price}
                      </span>
                      <span className="mb-1 text-sm font-medium text-slate-500">
                        {plan.duration}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${isSelected ? 'text-[#c45c26]' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isSelected) {
                          setSelectedPlan(plan._id)
                        } else {
                          handleSubscribe(plan)
                        }
                      }}
                      disabled={isProcessing && isSelected}
                      className={`group flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${isSelected ? 'bg-[#7a280e] hover:bg-[#c45c26]' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 shadow-none'}`}
                    >
                      {isProcessing && isSelected ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          {isSelected ? 'Subscribe Now' : 'Select Plan'}
                          {isSelected && <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
            </AnimatePresence>
          )}
        </section>
        
        <div className="mt-8 text-center px-4 pb-4">
          <p className="text-[11px] font-medium text-slate-400">
            By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew unless canceled.
          </p>
        </div>
      </VendorPageLayout>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 left-0 right-0 z-50 mx-auto flex w-max max-w-[90%] items-center gap-2 rounded-full bg-[#7a280e] px-5 py-3 text-sm font-bold text-white shadow-xl ring-1 ring-white/10"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
