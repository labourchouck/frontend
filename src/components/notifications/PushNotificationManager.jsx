import { usePushNotifications } from '../../hooks/usePushNotifications.js'
import { PushPermissionBanner } from './PushPermissionBanner.jsx'

/** Mounted once in App.jsx: registers the device for push (all roles) and shows the "Turn on notifications" prompt. */
export function PushNotificationManager() {
  const { loggedIn, permission, busy, enable } = usePushNotifications()
  return <PushPermissionBanner loggedIn={loggedIn} permission={permission} busy={busy} onEnable={enable} />
}
