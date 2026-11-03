import { useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth.js'
import { useSocket } from '../../context/SocketContext.jsx'
import { fetchMe } from '../../api/authApi.js'
import { setUser } from '../../store/slices/authSlice.js'
import { isLabourLocked, isPathAllowedWhileLocked } from '../../lib/labourAccess.js'

const RECHECK_MS = 10000

/**
 * Wraps the app shell. A labour whose KYC is not approved can only see the verification screen (and help pages):
 * any other address sends them back to it. While locked, the app re-checks their status so the app opens by itself
 * the moment the admin approves — on a notification, when they return to the app, and every few seconds.
 */
export function LabourKycGate({ children }) {
  const { realUser, token } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const socket = useSocket()
  const locked = isLabourLocked(realUser)
  const wasLocked = useRef(false)

  // Recheck KYC status while locked.
  useEffect(() => {
    if (!locked || !token) return undefined
    let cancelled = false
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetchMe()
        if (!cancelled && res?.data?.user) dispatch(setUser(res.data.user))
      } catch {
        /* offline: try again next time */
      }
    }
    const onNotification = (n) => {
      if (typeof n?.type === 'string' && n.type.startsWith('KYC_')) refresh()
    }
    const id = setInterval(refresh, RECHECK_MS)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    socket?.on('NOTIFICATION', onNotification)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      socket?.off('NOTIFICATION', onNotification)
    }
  }, [locked, token, socket, dispatch])

  // Approved while the app was open: take them to the home screen.
  useEffect(() => {
    if (wasLocked.current && !locked) navigate('/app', { replace: true })
    wasLocked.current = locked
  }, [locked, navigate])

  if (locked && !isPathAllowedWhileLocked(pathname)) {
    return <Navigate to="/app/kyc" replace />
  }
  return children
}
