/**
 * Standard vendor screen layout — matches app shell spacing (no double -mx-4).
 * @param {object} props
 * @param {import('react').ReactNode} [props.hero]
 * @param {import('react').ReactNode} props.children
 * @param {boolean} [props.sheet] — white rounded sheet below hero (home style)
 */
export function VendorPageLayout({ hero, children, sheet = false }) {
  if (sheet) {
    return (
      <div className="min-w-0 overflow-x-hidden pb-2">
        {hero}
        <section className="relative z-20 -mt-5 space-y-5 rounded-t-[1.75rem] bg-white px-4 pb-6 pt-5 shadow-[0_-12px_40px_-18px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/90">
          {children}
        </section>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-2">
      {hero}
      {children ? <div className="space-y-4 px-4">{children}</div> : null}
    </div>
  )
}

/** Glass card with consistent inner padding */
export function VendorCard({ children, className = '', as: Tag = 'div', ...rest }) {
  const Comp = Tag
  return (
    <Comp
      className={`rounded-3xl border border-slate-200/90 bg-white/85 p-4 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  )
}
