import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ArrowRight, Briefcase, HardHat, PackageSearch } from 'lucide-react'
import { ButtonLink } from '../ui/ButtonLink'
import { useLandingCta } from '../../hooks/useLandingCta.js'
import { useFrameSequence, useNearViewport } from '../../hooks/useFrameSequence.js'

const FRAME_COUNT = 120
const FRAME_W = 1280
const FRAME_H = 720

const frameSrc = (i) => `/assets/frames/site/frame-${String(i + 1).padStart(3, '0')}.jpg`

/** Copy that fades in/out as the site "video" scrubs. Ranges are scroll progress 0..1. */
const chapters = [
  {
    id: 'labour',
    range: [0.02, 0.3],
    eyebrow: 'Hire labour',
    title: 'Verified workers, on your site by morning',
    text: 'Masons, helpers, electricians and 60+ services booked in minutes from the live catalogue.',
    Icon: HardHat,
    align: 'left',
    href: '#labour',
  },
  {
    id: 'corporate',
    range: [0.36, 0.64],
    eyebrow: 'Corporate workforce',
    title: 'Staff whole projects with attendance and billing built in',
    text: 'Bulk requests, daily check-ins, GST invoices and analytics for builders and enterprises.',
    Icon: Briefcase,
    align: 'right',
    href: '#corporate',
  },
  {
    id: 'buildmart',
    range: [0.7, 0.96],
    eyebrow: 'BuildMart & vendors',
    title: 'Materials delivered, vendors paid, everything tracked',
    text: 'Cement to safety gear from rated suppliers, plus a vendor panel for crews and storefronts.',
    Icon: PackageSearch,
    align: 'left',
    href: '#buildmart',
  },
]

function Chapter({ chapter, progress, reduce }) {
  const [start, end] = chapter.range
  const fadeIn = Math.min(start + 0.06, end)
  const fadeOut = Math.max(end - 0.06, start)
  const opacity = useTransform(progress, [start, fadeIn, fadeOut, end], [0, 1, 1, 0])
  const y = useTransform(progress, [start, fadeIn, fadeOut, end], reduce ? [0, 0, 0, 0] : [40, 0, 0, -40])
  const side = chapter.align === 'right' ? 'lg:ml-auto lg:text-right lg:items-end' : ''

  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute inset-x-0 bottom-0 top-0 flex flex-col justify-end p-6 sm:p-10 lg:justify-center ${side}`}
    >
      <div className={`pointer-events-auto flex max-w-xl flex-col gap-3 ${chapter.align === 'right' ? 'lg:items-end' : ''}`}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/25 backdrop-blur">
          <chapter.Icon className="h-3.5 w-3.5 text-brand-bright" aria-hidden />
          {chapter.eyebrow}
        </span>
        <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl">
          {chapter.title}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-zinc-100/90 drop-shadow sm:text-base">{chapter.text}</p>
        <a
          href={chapter.href}
          className="group mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-bright underline-offset-4 hover:underline"
        >
          See how it works
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </a>
      </div>
    </motion.div>
  )
}

/**
 * Apple-style scroll-scrubbed image sequence. The outer section is tall; a
 * sticky stage inside draws the frame matching the current scroll progress.
 */
export function ScrollFrameSequence() {
  const reduce = useReducedMotion()
  const cta = useLandingCta()
  const sectionRef = useRef(null)
  const near = useNearViewport(sectionRef, '800px')

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  const { canvasRef, draw, loaded } = useFrameSequence({
    frameSrc,
    frameCount: FRAME_COUNT,
    active: near && !reduce,
  })

  const frameIndex = useTransform(smooth, [0, 1], [0, FRAME_COUNT - 1])
  useMotionValueEvent(frameIndex, 'change', (v) => draw(v))

  const stageScale = useTransform(smooth, [0, 0.12, 0.9, 1], [0.86, 1, 1, 0.94])
  const stageRadius = useTransform(smooth, [0, 0.12, 0.9, 1], [40, 0, 0, 32])
  const progressBar = useTransform(smooth, [0, 1], ['0%', '100%'])

  useEffect(() => {
    if (loaded > 0) draw(frameIndex.get())
  }, [loaded, draw, frameIndex])

  if (reduce) {
    return (
      <section id="story" className="relative bg-slate-950" aria-label="LaborChowck on site">
        <img
          src={frameSrc(60)}
          alt="Construction site with LaborChowck workers"
          className="h-[70vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <h3 className="text-3xl font-extrabold">
            Verified workers, bulk staffing, and materials on one platform
          </h3>
        </div>
      </section>
    )
  }

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative bg-slate-950"
      style={{ height: '320vh' }}
      aria-label="LaborChowck on site"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(28,175,98,0.18),transparent)]" />
        <motion.div
          style={{ scale: stageScale, borderRadius: stageRadius }}
          className="relative h-full w-full overflow-hidden bg-slate-900 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8)]"
        >
          <canvas
            ref={canvasRef}
            width={FRAME_W}
            height={FRAME_H}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
          {loaded === 0 ? (
            <img
              src={frameSrc(0)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-slate-950/15" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/45 via-transparent to-slate-950/45" />

          <div className="absolute inset-0 mx-auto w-full max-w-6xl">
            {chapters.map((c) => (
              <Chapter key={c.id} chapter={c} progress={smooth} reduce={reduce} />
            ))}
          </div>

          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/15 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-bright opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-bright" />
            </span>
            Scroll to see a day on a LaborChowck site
          </div>

          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 sm:inset-x-10">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.div
                style={{ width: progressBar }}
                className="h-full bg-gradient-to-r from-brand to-brand-bright"
              />
            </div>
            <ButtonLink href="/app" variant="primary" className="!py-2.5 !text-xs" onClick={cta.hireLabour}>
              Hire Labour
            </ButtonLink>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
