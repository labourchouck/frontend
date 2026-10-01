import { getCategoryImageUrl } from '../../../../lib/labourCategoryDisplay.js'
import { pastelAt } from './homeTheme.js'

/** Zepto-style 4-column tile grid: soft tile with the photo, label underneath. */
export function HomeSkillGrid({ group, skills, onOpenSkill, colorOffset = 0 }) {
  return (
    <div className="grid grid-cols-4 gap-x-2.5 gap-y-3.5">
      {skills.map((cat, i) => (
        <button
          key={String(cat._id)}
          type="button"
          onClick={() => onOpenSkill(group, cat)}
          className="group flex flex-col items-center text-center transition active:scale-95"
        >
          <span className={`block aspect-square w-full overflow-hidden rounded-2xl ${pastelAt(i + colorOffset)}`}>
            <img
              src={getCategoryImageUrl(cat)}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </span>
          <span className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight text-slate-800">{cat.name}</span>
        </button>
      ))}
    </div>
  )
}
