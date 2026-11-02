import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { buildGuestUser, clearBootRole, readBootRole, writeBootRole } from '../lib/bootPersona.js'
import { clearSession, setCredentials } from '../store/slices/authSlice.js'
import { baseApi } from '../store/api/baseApi.js'
import { apiRequest } from '../api/http.js'
import { unregisterFcmToken } from '../api/notificationsApi.js'

export function useAuth() {
  const dispatch = useDispatch()
  const { token, user: realUser, loading } = useSelector((s) => s.auth)
  const [bootRole, setBootRoleState] = useState(() => readBootRole())

  const effectiveUser = useMemo(() => {
    if (realUser) return realUser
    if (bootRole) return buildGuestUser(bootRole)
    return null
  }, [realUser, bootRole])

  const isGuest = Boolean(!token && !realUser && bootRole)

  const isAuthenticated = Boolean(
    (token && realUser) || (!token && bootRole && effectiveUser),
  )

  const setBootRole = useCallback((role) => {
    writeBootRole(role)
    setBootRoleState(role)
  }, [])

  const logout = useCallback(async () => {
    // 0. Stop push notifications for this account on this device (needs the token, so before clearing it)
    try {
      const fcmToken = localStorage.getItem('lc_fcm_token')
      if (fcmToken) {
        await Promise.race([unregisterFcmToken(fcmToken), new Promise((resolve) => setTimeout(resolve, 1500))])
        localStorage.removeItem('lc_fcm_token')
      }
    } catch {
      // Best-effort: never block logging out
    }
    // 1. Clear local credentials synchronously first so route guards and auth pages never see stale tokens
    clearBootRole()
    setBootRoleState(null)
    dispatch(clearSession())
    try {
      dispatch(baseApi.util.resetApiState())
    } catch (err) {
      // Ignore if store is not ready
    }
    // 2. Notify backend (best-effort)
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (e) {
      // Ignore network errors on logout
    }
  }, [dispatch])

  const applySession = useCallback(
    (accessToken, nextUser) => {
      clearBootRole()
      setBootRoleState(null)
      dispatch(setCredentials({ accessToken, user: nextUser }))
    },
    [dispatch],
  )

  return {
    token,
    user: effectiveUser,
    realUser,
    bootRole,
    loading,
    isGuest,
    isAuthenticated,
    setBootRole,
    applySession,
    logout,
  }
}
