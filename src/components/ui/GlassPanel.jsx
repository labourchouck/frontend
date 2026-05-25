export function GlassPanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white/85 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}
