import { ChevronRight } from 'lucide-react'
import instantImg from '../../../../assets/user_home_images/instant.png'
import scheduleImg from '../../../../assets/user_home_images/schedule.png'

const MODES = [
  {
    id: 'instant',
    title: 'Instant',
    desc: 'Worker right away',
    img: instantImg,
    tone: 'bg-linear-to-br from-[#FFF4DD] to-[#FFE7C2]',
    cta: 'text-amber-700',
  },
  {
    id: 'scheduled',
    title: 'Schedule',
    desc: 'Pick date & time',
    img: scheduleImg,
    tone: 'bg-linear-to-br from-[#E8F6EE] to-[#CFEFDD]',
    cta: 'text-emerald-700',
  },
]

export function HomeModeCards({ onPickMode }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPickMode(m.id)}
          className={`relative flex h-[92px] flex-col items-start justify-center overflow-hidden rounded-2xl px-3.5 text-left transition active:scale-[0.97] ${m.tone}`}
          aria-label={`${m.title} booking`}
        >
          <span className="relative z-10 text-[15px] font-black tracking-tight text-slate-900">{m.title}</span>
          <span className="relative z-10 mt-0.5 text-[11px] font-medium text-slate-600">{m.desc}</span>
          <span className={`relative z-10 mt-1.5 flex items-center text-[11px] font-extrabold ${m.cta}`}>
            Book now
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
          <img src={m.img} alt="" className="pointer-events-none absolute -bottom-1 right-1 h-16 w-16 object-contain" />
        </button>
      ))}
    </div>
  )
}
