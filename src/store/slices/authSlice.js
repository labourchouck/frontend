import { createSlice } from '@reduxjs/toolkit'

export const AUTH_STORAGE_KEY = 'lc_access_token'
// Last user the server confirmed. Lets the app stay on the current page (instead of the login screen) when the
// network is slow or down while the session is still valid.
export const USER_CACHE_KEY = 'lc_cached_user'

export function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedUser(user) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    /* storage full / unavailable — the cache is only a convenience */
  }
}

function readStoredToken() {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_STORAGE_KEY)
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: readStoredToken(),
    user: null,
    loading: Boolean(readStoredToken()),
  },
  reducers: {
    setCredentials(state, action) {
      const { accessToken, user } = action.payload
      if (accessToken) localStorage.setItem(AUTH_STORAGE_KEY, accessToken)
      else localStorage.removeItem(AUTH_STORAGE_KEY)
      state.token = accessToken ?? null
      state.user = user ?? null
      writeCachedUser(user ?? null)
    },
    setUser(state, action) {
      state.user = action.payload
      if (action.payload) writeCachedUser(action.payload)
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    clearSession(state) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      writeCachedUser(null)
      state.token = null
      state.user = null
      state.loading = false
    },
  },
})

export const { setCredentials, setUser, setLoading, clearSession } = authSlice.actions
export const authReducer = authSlice.reducer
