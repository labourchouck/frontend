import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, ShoppingCart, Sparkles, ChevronRight, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { 
  useGetCorporateSubscriptionPlansQuery, 
  useCreateCorporateSubscriptionOrderMutation,
  useVerifyCorporateSubscriptionPaymentMutation
} from '../../../store/api/workforceApi.js'

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function CorporateSubscriptionPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { data, isLoading: loading } = useGetCorporateSubscriptionPlansQuery()
  const [createOrder] = useCreateCorporateSubscriptionOrderMutation()
  const [verifyPayment] = useVerifyCorporateSubscriptionPaymentMutation()
  
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (data?.plans) {
      const fetchedPlans = data.plans
      setPlans(fetchedPlans)
      if (fetchedPlans.length > 0) {
        const recommended = fetchedPlans.find(p => p.recommended)
        setSelectedPlan(recommended ? recommended._id : fetchedPlans[0]._id)
      }
    }
  }, [data])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSubscribe = async (plan) => {
    setIsProcessing(true)
    try {
      // Load Razorpay SDK
      const razorpayLoaded = await loadRazorpay()
      if (!razorpayLoaded) {
        showToast('Failed to load payment gateway')
        setIsProcessing(false)
        return
      }

      // Initialize payment order
      const initRes = await createOrder({ planId: plan._id }).unwrap()

      if (!initRes || !initRes.order) {
        showToast('Failed to initialize payment')
        setIsProcessing(false)
        return
      }

      const options = {
        key: initRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: initRes.order.amount,
        currency: initRes.order.currency,
        name: 'LabourChowk',
        description: `Subscription to ${plan.name}`,
        order_id: initRes.order.id,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id
            }).unwrap()
            showToast(`Successfully subscribed to ${plan.name}!`)
            setTimeout(() => {
              navigate('/corporate', { replace: true })
            }, 1500)
          } catch (err) {
            console.error(err)
            showToast('Payment verification failed')
          }
        },
        prefill: {
          name: user?.fullName || 'Corporate User',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#2bb972'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        showToast('Payment failed')
      })
      rzp.open()

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
      className="bg-slate-50 -mx-4 px-4 pb-12 min-h-dvh"
    >
        {/* Header Section */}
        <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-[#1a935b] to-[#2bb972] px-4 pb-12 pt-8 text-white shadow-2xl">
          
          <div className="relative mb-6 flex items-center justify-between">
            <Link to="/corporate" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 ring-1 ring-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-tr from-emerald-400 to-green-500 p-1 shadow-lg shadow-green-500/40">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a935b]/40 backdrop-blur-md">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-black text-white tracking-tight">Unlock Bookings</h1>
            <p className="text-sm font-medium text-emerald-100 max-w-[280px]">
              Subscribe to a plan to start booking vendors and crews.
            </p>
          </div>
          
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        {/* Pricing Cards Section */}
        <section className="relative z-10 -mt-6 px-4 max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2bb972] border-t-transparent"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex justify-center py-10 text-slate-500 font-medium">
              No subscription plans available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className={`absolute inset-0 bg-gradient-to-br from-[#1a935b] to-[#2bb972] opacity-100 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                  
                  {plan.recommended && (
                    <div className="absolute top-0 right-6 rounded-b-lg bg-gradient-to-r from-[#2bb972] to-[#1a935b] px-3 py-1 shadow-md z-20">
                      <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white">
                        <Sparkles className="h-3 w-3" /> Most Popular
                      </p>
                    </div>
                  )}

                  <div className={`relative flex h-full flex-col justify-between rounded-[1.4rem] bg-white p-6 z-10 ${isSelected ? '' : 'ring-1 ring-slate-200'}`}>
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h3 className={`text-lg font-black uppercase tracking-wide ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">{plan.description}</p>
                      </div>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${isSelected ? 'border-transparent bg-[#2bb972]' : 'border-slate-300 bg-transparent'}`}>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </div>

                    <div className="mb-6 flex items-end gap-1">
                      <span className={`text-4xl font-black ${isSelected ? 'text-[#2bb972]' : 'text-slate-900'}`}>
                        ₹{plan.price}
                      </span>
                    </div>
                    
                    <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2">
                       <span className="text-xs font-bold text-emerald-700">Includes {plan.allowedBookings} Bookings</span>
                    </div>

                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${isSelected ? 'text-[#2bb972]' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

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
                      className={`group flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${isSelected ? 'bg-[#1a935b] hover:bg-[#2bb972]' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 shadow-none'}`}
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
            </div>
          )}
        </section>
        
        <div className="mt-8 text-center px-4 pb-4">
          <p className="text-[11px] font-medium text-slate-400">
            By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew unless canceled.
          </p>
        </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 left-0 right-0 z-50 mx-auto flex w-max max-w-[90%] items-center gap-2 rounded-full bg-[#1a935b] px-5 py-3 text-sm font-bold text-white shadow-xl ring-1 ring-white/10"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
