/** A scheduled booking must start at least this long after the moment it is booked, so the 1-hour-before broadcast can happen. */
export const MIN_SCHEDULE_LEAD_MINUTES = 60

/** "14:05", "2:05 PM" -> { h, m } (24h), or null. */
export function parseTime(timeStr) {
  const match = String(timeStr || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const ampm = match[3]?.toUpperCase()
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  if (h > 23 || m > 59) return null
  return { h, m }
}

/** Epoch ms of a booking date ("2026-11-02") + time, read as Indian time (the app's booking timezone). */
export function scheduledStartMs(dateISO, timeStr) {
  const t = parseTime(timeStr)
  const date = String(dateISO || '').split('T')[0]
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const pad = (n) => String(n).padStart(2, '0')
  const ms = new Date(`${date}T${pad(t.h)}:${pad(t.m)}:00+05:30`).getTime()
  return Number.isFinite(ms) ? ms : null
}

const formatIst = (ms) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(ms))

/**
 * Is this start time at least one hour away? Compared at minute precision, so booking at 5:00:30 for 6:00 is fine.
 * @returns {{ ok: boolean, message?: string, earliestMs: number }}
 */
export function checkScheduleLeadTime(dateISO, timeStr, nowMs = Date.now()) {
  const minuteStart = Math.floor(nowMs / 60000) * 60000
  const earliestMs = minuteStart + MIN_SCHEDULE_LEAD_MINUTES * 60000
  const startMs = scheduledStartMs(dateISO, timeStr)
  if (startMs == null || startMs >= earliestMs) return { ok: true, earliestMs }

  const sameDay =
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(earliestMs)) === String(dateISO).split('T')[0]
  return {
    ok: false,
    earliestMs,
    message: `Please book at least 1 hour in advance. The earliest start time you can choose is ${formatIst(earliestMs)}${sameDay ? ' today' : ''}.`,
  }
}
