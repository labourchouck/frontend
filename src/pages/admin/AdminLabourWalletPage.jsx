import { useEffect, useState, useMemo } from 'react'
import { Wallet, Clock, CheckCircle2, XCircle, Download, Search, Filter, Eye, X, UserCircle, Landmark, QrCode } from 'lucide-react'
import { adminBookingsApi } from '../../api/adminBookingsApi.js'
import { apiRequest } from '../../api/http.js'

export function AdminLabourWalletPage() {
  const [bookings, setBookings] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters for Payout History
  const [historyFilter, setHistoryFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bookings to calculate dues and balances
        const bookingsRes = await adminBookingsApi.getAllBookings({ limit: 5000 })
        const allB = bookingsRes?.data?.bookings || bookingsRes?.bookings || bookingsRes || []
        setBookings(Array.isArray(allB) ? allB : [])

        // Attempt to fetch real withdrawals (stubbed if backend isn't ready)
        try {
          const wRes = await apiRequest('/admin/withdrawals', { method: 'GET' })
          setWithdrawals(wRes.data || wRes || [])
        } catch (err) {
          console.warn('Backend /admin/withdrawals not found, falling back to dummy data for UI preview.')
          setWithdrawals([
            {
              _id: 'w101',
              labor: { name: 'Ramesh Kumar', phone: '+91 9876543210' },
              amount: 4500,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              bankDetails: {
                accountHolderName: 'Ramesh Kumar',
                bankName: 'State Bank of India',
                accountNumber: '32114567890',
                ifscCode: 'SBIN0001234',
                qrCode: '' // Add a dummy image URL here if needed
              }
            },
            {
              _id: 'w102',
              labor: { name: 'Suresh Singh', phone: '+91 8765432109' },
              amount: 2100,
              status: 'COMPLETED',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              _id: 'w103',
              labor: { name: 'Amit Sharma', phone: '+91 7654321098' },
              amount: 1500,
              status: 'REJECTED',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            }
          ])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Action Handlers
  const handleUpdateStatus = async (id, status) => {
    // Optimistic UI update
    setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status } : w))
    setSelectedRequest(null)
    try {
      await apiRequest(`/admin/withdrawals/${id}/status`, {
        method: 'PATCH',
        body: { status }
      })
    } catch (err) {
      console.warn('Backend patch failed (frontend-only mode)', err)
    }
  }

  // Calculate Metrics and Leaderboard
  const { totalUnpaid, labourBalances } = useMemo(() => {
    let unpaid = 0
    const balanceMap = new Map()

    bookings.forEach(b => {
      if (b.paymentMethod === 'ONLINE' && b.status === 'COMPLETED' && b.laborShare) {
        unpaid += b.laborShare
        
        const labourName = b.labor?.name || b.provider?.name || 'Unknown Labourer'
        balanceMap.set(labourName, (balanceMap.get(labourName) || 0) + b.laborShare)
      }
    })

    // Subtract paid withdrawals from total unpaid and individual balances
    withdrawals.forEach(w => {
      if (w.status === 'COMPLETED') {
        unpaid -= w.amount
        const name = w.labor?.name || 'Unknown Labourer'
        if (balanceMap.has(name)) {
          balanceMap.set(name, Math.max(0, balanceMap.get(name) - w.amount))
        }
      }
    })

    const topBalances = Array.from(balanceMap.entries())
      .map(([name, balance]) => ({ name, balance }))
      .filter(l => l.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)

    return { totalUnpaid: Math.max(0, unpaid), labourBalances: topBalances }
  }, [bookings, withdrawals])

  const pendingAmount = useMemo(() => {
    return withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + (w.amount || 0), 0)
  }, [withdrawals])

  const totalPaidOut = useMemo(() => {
    return withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + (w.amount || 0), 0)
  }, [withdrawals])

  // Filtered History
  const historyWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      if (w.status === 'PENDING') return false // Only history (Completed/Rejected)
      if (historyFilter !== 'ALL' && w.status !== historyFilter) return false
      
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        const idMatch = w._id?.toLowerCase().includes(lowerSearch)
        const nameMatch = w.labor?.name?.toLowerCase().includes(lowerSearch)
        if (!idMatch && !nameMatch) return false
      }
      return true
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [withdrawals, historyFilter, searchTerm])

  const pendingWithdrawals = useMemo(() => {
    return withdrawals.filter(w => w.status === 'PENDING').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }, [withdrawals])

  // Pagination Logic for History
  const totalPages = Math.ceil(historyWithdrawals.length / itemsPerPage)
  const currentHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return historyWithdrawals.slice(start, start + itemsPerPage)
  }, [historyWithdrawals, currentPage])

  // Export to CSV
  const handleExportCSV = () => {
    if (historyWithdrawals.length === 0) return
    const headers = ['Request ID', 'Date', 'Labour Name', 'Amount', 'Status']
    const rows = historyWithdrawals.map(w => [
      w._id,
      new Date(w.createdAt).toLocaleDateString(),
      w.labor?.name || 'N/A',
      w.amount || 0,
      w.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payout_history.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 relative">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Labour Wallet</h1>
        <p className="text-sm text-slate-500">Manage balances, process payouts, and view history.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800/70">Total Unpaid Dues</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">₹{loading ? '...' : totalUnpaid.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800/70">Pending Requests</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-700">₹{loading ? '...' : pendingAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800/70">Total Paid Out</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">₹{loading ? '...' : totalPaidOut.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Pending Requests Section */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="font-bold text-slate-900">Action Required: Pending Requests</h3>
            <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {pendingWithdrawals.length} New
            </span>
          </div>
          
          <div className="flex-1 p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm font-medium text-slate-500 animate-pulse">Loading requests...</div>
            ) : pendingWithdrawals.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 text-emerald-200 mb-3" />
                <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                <p className="text-xs">No pending withdrawal requests.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Labourer</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Requested</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingWithdrawals.map(req => (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{req.labor?.name}</p>
                        <p className="text-xs text-slate-500">{req.labor?.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-blue-600">₹{(req.amount || 0).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Labour Balances Leaderboard */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-slate-900">Highest Outstanding Balances</h3>
          </div>
          {loading ? (
            <div className="animate-pulse text-sm text-slate-400">Loading balances...</div>
          ) : labourBalances.length === 0 ? (
            <div className="text-sm text-slate-500">No outstanding dues.</div>
          ) : (
            <div className="space-y-4">
              {labourBalances.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-amber-200/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-amber-100">
                      <UserCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="font-semibold text-slate-700">{l.name}</span>
                  </div>
                  <span className="font-black text-amber-700">₹{l.balance.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout History Ledger */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-8">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-bold text-slate-900">Payout History Ledger</h3>
          <div className="flex items-center gap-3">
            <select 
              value={historyFilter} 
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
            <button 
              onClick={handleExportCSV}
              disabled={historyWithdrawals.length === 0}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Request ID & Date</th>
                <th className="px-6 py-3 font-semibold">Labourer</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentHistory.length > 0 ? (
                currentHistory.map(w => (
                  <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">#{w._id.slice(-6)}</p>
                      <p className="text-xs text-slate-400">{new Date(w.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {w.labor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{(w.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${
                        w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No history found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
            <p className="text-xs font-semibold text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900">Process Request</h3>
                <p className="text-xs font-semibold text-slate-500">#{selectedRequest._id}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 rounded-xl bg-blue-50 p-4 text-center border border-blue-100">
                <p className="text-sm font-semibold text-blue-800">Requested Amount</p>
                <p className="text-4xl font-black text-blue-600 mt-1">₹{(selectedRequest.amount || 0).toLocaleString('en-IN')}</p>
              </div>

              <div className="mb-6 space-y-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-slate-400" /> Bank Details
                </h4>
                {selectedRequest.bankDetails ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                    <div className="flex justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                      <span className="text-slate-500">Account Name</span>
                      <span className="font-bold text-slate-900">{selectedRequest.bankDetails.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 px-4 py-3">
                      <span className="text-slate-500">Bank Name</span>
                      <span className="font-semibold text-slate-900">{selectedRequest.bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                      <span className="text-slate-500">Account Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedRequest.bankDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-slate-500">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900">{selectedRequest.bankDetails.ifscCode}</span>
                    </div>
                    {selectedRequest.bankDetails.qrCode && (
                      <div className="border-t border-slate-200 p-4 flex flex-col items-center bg-slate-50">
                        <span className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><QrCode className="w-3 h-3"/> QR Code</span>
                        <img src={selectedRequest.bankDetails.qrCode} alt="QR Code" className="w-32 h-32 object-contain rounded-lg border border-slate-200" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100">No bank details provided for this request.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'REJECTED')}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 hover:border-rose-200"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'COMPLETED')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
