const TRUST_ITEMS = [
  {
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=70',
    caption: 'Verified Professionals You Can Trust',
  },
  {
    img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=70',
    caption: 'Well Trained to deliver great service',
  },
  {
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70',
    caption: 'Safe, reliable, and efficient every single time',
  },
]

export function IndividualHomeTrustSection() {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100" aria-label="Why trust Mappto">
      <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Reliable &amp; Trustworthy</h3>
      <p className="mt-0.5 text-xs font-medium text-slate-500">Ensuring integrity through verified standards</p>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {TRUST_ITEMS.map((item) => (
          <div key={item.caption} className="flex flex-col items-center text-center">
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
              <img src={item.img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </div>
            <p className="mt-2 text-[11px] font-bold leading-snug text-slate-700">{item.caption}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
