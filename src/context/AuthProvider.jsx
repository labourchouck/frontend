import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '../api/authApi.js'
import { clearSession, readCachedUser, setLoading, setUser } from '../store/slices/authSlice.js'

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const token = useSelector((s) => s.auth.token)

  useEffect(() => {
    let cancelled = false

    if (!token) {
      queueMicrotask(() => {
        if (!cancelled) {
          dispatch(setUser(null))
          dispatch(setLoading(false))
        }
      })
      return () => {
        cancelled = true
      }
    }

    queueMicrotask(() => {
      if (!cancelled) dispatch(setLoading(true))
    })

    // Only a real "not authorised" answer (401) may end the session. A slow / dropped connection, timeout or 5xx must
    // keep the user on the page they are on, using the last user the server confirmed, and retry in the background.
    const SLOW_MS = 8000
    let retryTimer = null

    const load = () =>
      Promise.race([
        fetchMe(),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { offline: true })), SLOW_MS)),
      ])
        .then((res) => {
          if (!cancelled) dispatch(setUser(res.data?.user ?? null))
        })
        .catch((err) => {
          if (cancelled) return
          if (err?.status === 401 || err?.status === 403) {
            dispatch(clearSession())
            return
          }
          const cached = readCachedUser()
          if (cached) dispatch(setUser(cached))
          else dispatch(clearSession())
          retryTimer = setTimeout(() => {
            if (!cancelled) load().finally(() => {})
          }, 15000)
        })
        .finally(() => {
          if (!cancelled) dispatch(setLoading(false))
        })

    load()
    const onOnline = () => {
      if (!cancelled) load()
    }
    window.addEventListener('online', onOnline)

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      window.removeEventListener('online', onOnline)
    }
  }, [token, dispatch])

  return children
}
