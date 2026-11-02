/**
 * Selected service — prominent highlight on booking steps.
 * Leads with the service the user picked (e.g. "Home Appliance Repair Technician") and keeps the
 * category / group underneath for context.
 */
export function BookingServiceHighlight({ serviceName, categoryName, groupName, kicker = 'Booking for' }) {
  const title = serviceName || categoryName
  if (!title) return null
  const context = [serviceName ? categoryName : null, groupName].filter(Boolean).join(' · ')

  return (
    <div className="lc-booking-highlight" role="status">
      <p className="lc-booking-highlight-kicker">{kicker}</p>
      <p className="lc-booking-highlight-title">{title}</p>
      {context ? <p className="lc-booking-highlight-sub">{context}</p> : null}
    </div>
  )
}
