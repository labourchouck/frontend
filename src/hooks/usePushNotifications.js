import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { requestFcmToken, onForegroundMessage } from '../lib/firebase.js'
import { registerFcmToken } from '../api/notificationsApi.js'

export const FCM_TOKEN_STORAGE_KEY = 'lc_fcm_token'

const readPermission = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

/**
 * Registers this device for push notifications once the user is logged in (any role: individual, labour,
 * vendor, corporate, admin), and surfaces foreground FCM messages as system notifications.
 * Mount once (see <PushNotificationManager /> in App.jsx).
 *
 * Permission is requested from a button (see PushPermissionBanner) because browsers often suppress
 * permission dialogs that are not triggered by a click.
 */
export function usePushNotifications() {
  const authToken = useSelector((s) => s.auth.token)
  const [permission, setPermission] = useState(readPermission)
  const [busy, setBusy] = useState(false)
  const unsubscribeRef = useRef(() => {})

  const register = useCallback(async ({ askPermission }) => {
    try {
      const fcmToken = await requestFcmToken({ askPermission })
      setPermission(readPermission())
      if (!fcmToken) {
        console.info('[push] No FCM token (permission:', readPermission(), ')')
        return false
      }

      // Always (re)register: the server moves a device token to whoever is logged in on this device.
      await registerFcmToken(fcmToken, 'web')
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken)
      console.info('[push] Device registered for push notifications')

      unsubscribeRef.current()
      // Foreground messages are not auto-displayed by the SDK — show them ourselves
      unsubscribeRef.current = await onForegroundMessage(async (payload) => {
        console.info('[push] Foreground FCM message received:', payload?.data?.type, payload)
        const title = payload.notification?.title || payload.data?.title || 'Mappto'
        const body = payload.notification?.body || payload.data?.body || ''
        const options = {
          body,
          icon: '/logo.svg',
          badge: '/favicon.svg',
          data: payload.data || {},
          tag: payload.data?.type || 'mappto',
        }
        try {
          const registration =
            (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')) ||
            (await navigator.serviceWorker.ready)
          if (registration) {
            await registration.showNotification(title, options)
          } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(title, options)
          } else {
            console.warn('[push] No service worker registration — notification not displayed')
          }
        } catch (error) {
          console.warn('[push] Failed to display foreground notification:', error)
        }
      })
      return true
    } catch (error) {
      console.warn('[push] Push notification setup failed:', error)
      return false
    }
  }, [])

  // Logged in + permission already granted: register silently (no dialog).
  useEffect(() => {
    if (!authToken) return undefined
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the awaited registration, not synchronously
    if (readPermission() === 'granted') register({ askPermission: false })
    return () => {
      unsubscribeRef.current()
      unsubscribeRef.current = () => {}
    }
  }, [authToken, register])

  // Called from the banner's button (a real click, so the browser shows its dialog).
  const enable = useCallback(async () => {
    setBusy(true)
    await register({ askPermission: true })
    setBusy(false)
  }, [register])

  return { loggedIn: Boolean(authToken), permission, busy, enable }
}
