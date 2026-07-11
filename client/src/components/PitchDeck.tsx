import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion'
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'

/**
 * PitchDeck — judge-facing "how it actually works" sections appended below the
 * marketing landing page for the hackathon. Everything here is a *canned* loop:
 * no camera, no backend, deterministic on stage. The real pipeline lives in
 * LiveView; this is a faithful depiction of it.
 */

const EASE = [0.16, 1, 0.3, 1] as const

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}

/* ------------------------------------------------------------------ glyphs */

function CameraGlyph({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="6.5" width="13.5" height="11" rx="2.5" />
      <path d="M16 10.5 21 7.5 21 16.5 16 13.5Z" />
      {reduce ? (
        <circle cx="6" cy="9.8" r="1" fill="currentColor" stroke="none" />
      ) : (
        <motion.circle
          cx="6"
          cy="9.8"
          r="1"
          fill="currentColor"
          stroke="none"
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </svg>
  )
}

function MeshGlyph() {
  const pts = [
    [5, 7],
    [12, 5],
    [19, 8],
    [7, 14],
    [13, 13],
    [18, 16],
    [10, 19],
  ]
  const links = [
    [0, 1],
    [1, 2],
    [0, 3],
    [1, 4],
    [2, 5],
    [3, 4],
    [4, 5],
    [3, 6],
    [4, 6],
  ]
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {links.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} opacity="0.5" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

function ChipGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" />
      {[9, 12, 15].map((p) => (
        <g key={p}>
          <line x1={p} y1="4.5" x2={p} y2="7" />
          <line x1={p} y1="17" x2={p} y2="19.5" />
          <line x1="4.5" y1={p} x2="7" y2={p} />
          <line x1="17" y1={p} x2="19.5" y2={p} />
        </g>
      ))}
    </svg>
  )
}

function BarsGlyph({ reduce }: { reduce: boolean }) {
  const bars = [10, 17, 7, 14]
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {bars.map((h, i) => {
        const x = 5 + i * 4.7
        return reduce ? (
          <line key={i} x1={x} y1={20} x2={x} y2={20 - h} />
        ) : (
          <motion.line
            key={i}
            x1={x}
            x2={x}
            y1={20}
            animate={{ y2: [20 - h * 0.4, 20 - h, 20 - h * 0.6, 20 - h * 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
          />
        )
      })}
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5" />
    </svg>
  )
}

function CloudGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.5-1.5A3.5 3.5 0 0 0 7 18Z" />
    </svg>
  )
}

function DbGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  )
}

function DeployGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  )
}

function KeyGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="14" r="3.5" />
      <path d="M11 12.5 19 4.5M16 5.5l2.5 2.5M14.5 7l2 2" />
    </svg>
  )
}

/* -------------------------------------------------------------- channels */

const CHANNEL_TEASERS = [
  { name: 'Face geometry', reads: 'smile · brow · gaze' },
  { name: 'The Tell', reads: 'pulse + arousal' },
  { name: 'Soft emotion', reads: '6 hedged states' },
] as const

/* ------------------------------------------------------------ rail packet */

function FlowPacket({ delay, reduce }: { delay: number; reduce: boolean }) {
  if (reduce) return null
  return (
    <motion.span
      className="absolute left-[16px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent-soft"
      style={{ boxShadow: '0 0 14px 4px rgba(180,199,236,0.55)' }}
      initial={{ top: '0%', opacity: 0 }}
      animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', delay, times: [0, 0.05, 0.9, 1] }}
      aria-hidden="true"
    />
  )
}

/* ---------------------------------------------------------------- stages */

type Stage = {
  tag?: string
  title: string
  detail: string
  glyph: (p: { reduce: boolean }) => ReactElement
  channels?: boolean
}

const STAGES: Stage[] = [
  {
    tag: 'On your laptop',
    title: 'Camera',
    detail: 'getUserMedia() opens the webcam at ~30 fps. Raw frames stay in this browser tab — they are never uploaded.',
    glyph: CameraGlyph,
  },
  {
    title: 'MediaPipe Face Landmarker',
    detail: '478 landmarks, 52 blendshapes and a 4×4 head-pose matrix, extracted on the GPU several times a second.',
    glyph: () => <MeshGlyph />,
  },
  {
    title: 'Local signal engine',
    detail:
      'Three reads in parallel — each smoothed against your partner’s own first-90-seconds baseline, each carrying its own confidence, fused into one 1 Hz frame.',
    glyph: BarsGlyph,
    channels: true,
  },
  {
    title: 'Deterministic event engine',
    detail:
      'EWMA baseline · sustained z-score · hysteresis · 90-second cooldown → a candidate nudge. Plain math decides when to speak. No model runs here.',
    glyph: () => <ChipGlyph />,
  },
]

function RailNode({ children }: { children?: ReactNode }) {
  return (
    <span className="absolute left-[16px] top-1.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-accent-soft/70 bg-[#1b1a16]">
      {children}
    </span>
  )
}

function StageRow({ s, reduce }: { s: Stage; reduce: boolean }) {
  const G = s.glyph
  return (
    <motion.li variants={rise} className="relative pl-16">
      <RailNode />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-accent-soft">
          <G reduce={reduce} />
        </span>
        <div className="flex-1">
          {s.tag && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40">{s.tag}</span>
          )}
          <h3 className="font-sans text-[17px] font-medium text-paper">{s.title}</h3>
          <p className="mt-1.5 max-w-[46ch] font-sans text-[14px] leading-relaxed text-paper/55">{s.detail}</p>
          {s.channels && (
            <ul className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1.5">
              {CHANNEL_TEASERS.map((ch) => (
                <li key={ch.name} className="font-mono text-[11px] text-paper/50">
                  <span className="text-paper/80">{ch.name}</span>
                  <span className="text-paper/30"> — </span>
                  {ch.reads}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.li>
  )
}

/* ------------------------------------------------------- pipeline section */

export function PipelineSection() {
  const reduce = !!useReducedMotion()

  return (
    <section className="relative left-[50%] right-[50%] mx-[-50vw] w-[100vw] overflow-hidden bg-[#1b1a16] py-28 px-7 text-paper">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(#F7F5F0 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1160px]">
        <motion.div
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-[640px] text-center"
        >
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-accent-soft/80">Under the hood</span>
          <h2 className="mt-4 font-sans text-[30px] md:text-[40px] font-medium leading-[1.1] tracking-tight text-paper">
            The app is simple.
            <br className="hidden sm:block" /> The pipeline isn’t.
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] font-sans text-[16px] leading-relaxed text-paper/55">
            Wavelength helps people who struggle to read how others are feeling — by computing cues on the laptop, then hedging every suggestion. Here’s the path a moment takes.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="relative mx-auto mt-16 max-w-[680px]"
        >
          <span
            className="pointer-events-none absolute left-[16px] top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-paper/10 via-accent-soft/30 to-accent/50"
            aria-hidden="true"
          />
          <FlowPacket delay={0} reduce={reduce} />
          <FlowPacket delay={2.75} reduce={reduce} />

          <motion.ol variants={container} className="flex flex-col gap-10">
            {STAGES.map((s) => (
              <StageRow key={s.title} s={s} reduce={reduce} />
            ))}
          </motion.ol>

          <motion.div variants={rise} className="relative my-10 pl-16">
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-accent-soft/40 bg-accent/10 px-4 py-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-soft/15 text-accent-soft">
                <LockGlyph />
              </span>
              <div>
                <p className="font-sans text-[14px] font-medium text-paper">Raw video never crosses this line.</p>
                <p className="font-mono text-[11px] leading-relaxed text-paper/50">
                  only ~1 signal frame / second + transcript text leave the laptop
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={rise} className="relative pl-16">
            <RailNode />
            <div className="rounded-xl border border-accent-soft/25 bg-accent/15 p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-soft/80">
                In the cloud · DigitalOcean
              </span>
              <h3 className="mt-1 font-sans text-[17px] font-medium text-paper">DigitalOcean Gradient</h3>
              <p className="mt-1.5 max-w-[46ch] font-sans text-[14px] leading-relaxed text-paper/60">
                Only now does a model see anything — and only numbers and text, never your face.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Haiku 4.5 — phrases the nudge',
                  'Sonnet 4.6 — streams the debrief',
                  'Managed Postgres — 1 frame/sec',
                  'App Platform — one deploy',
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-paper/70"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------- signals section */

const MESH_PTS: [number, number][] = [
  [80, 36],
  [110, 28],
  [140, 36],
  [64, 70],
  [100, 62],
  [136, 62],
  [156, 70],
  [78, 108],
  [110, 118],
  [142, 108],
  [96, 148],
  [124, 148],
]
const MESH_LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 5],
  [2, 6],
  [3, 4],
  [4, 5],
  [5, 6],
  [3, 7],
  [4, 8],
  [5, 9],
  [7, 8],
  [8, 9],
  [7, 10],
  [8, 10],
  [8, 11],
  [9, 11],
]

const EMOTION_LABELS = ['calm', 'happy', 'sad', 'tense', 'surprised', 'uncertain'] as const

/** Deterministic canned redistributions for the emotion bars loop. */
const EMOTION_FRAMES: number[][] = [
  [0.42, 0.22, 0.08, 0.1, 0.06, 0.12],
  [0.28, 0.34, 0.06, 0.08, 0.14, 0.1],
  [0.18, 0.12, 0.28, 0.22, 0.08, 0.12],
  [0.14, 0.1, 0.12, 0.36, 0.1, 0.18],
  [0.22, 0.16, 0.1, 0.14, 0.28, 0.1],
  [0.2, 0.14, 0.12, 0.16, 0.08, 0.3],
]

function MeshViz({ active, reduce }: { active: boolean; reduce: boolean }) {
  const animate = active && !reduce
  return (
    <svg viewBox="0 0 220 180" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={animate ? { x: [0, 4, -3, 0], rotate: [0, 1.2, -0.8, 0] } : undefined}
        transition={animate ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
        style={{ transformOrigin: '110px 90px' }}
      >
        {MESH_LINKS.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={MESH_PTS[a][0]}
            y1={MESH_PTS[a][1]}
            x2={MESH_PTS[b][0]}
            y2={MESH_PTS[b][1]}
            stroke="currentColor"
            strokeWidth="1"
            className="text-accent"
            animate={animate ? { opacity: [0.25, 0.55, 0.25] } : { opacity: 0.35 }}
            transition={animate ? { duration: 2.8, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' } : undefined}
          />
        ))}
        {MESH_PTS.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="2.2"
            fill="currentColor"
            className="text-ink"
            animate={animate ? { opacity: [0.45, 1, 0.45], r: [2, 2.6, 2] } : { opacity: 0.7 }}
            transition={animate ? { duration: 2.4, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' } : undefined}
          />
        ))}
      </motion.g>
    </svg>
  )
}

function RppgViz({ active, reduce }: { active: boolean; reduce: boolean }) {
  const animate = active && !reduce
  const [bpm, setBpm] = useState(71)
  const path =
    'M0 48 H28 L36 48 L44 18 L52 78 L60 48 H88 L96 48 L104 22 L112 74 L120 48 H148 L156 48 L164 16 L172 80 L180 48 H220'

  useEffect(() => {
    if (!animate) {
      setBpm(71)
      return
    }
    const id = window.setInterval(() => {
      setBpm((prev) => {
        const next = prev + (Math.random() > 0.5 ? 1 : -1)
        return Math.min(74, Math.max(68, next))
      })
    }, 900)
    return () => window.clearInterval(id)
  }, [animate])

  return (
    <div className="relative flex h-full w-full flex-col justify-between">
      <div className="flex items-baseline justify-between px-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">rPPG</span>
        <span className="font-mono text-[20px] font-medium tabular-nums text-accent">
          {bpm}
          <span className="ml-1 text-[11px] font-normal text-ink-3">BPM</span>
        </span>
      </div>
      <svg viewBox="0 0 220 96" className="w-full flex-1" aria-hidden="true">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rule" opacity="0.45" />
        {animate ? (
          <motion.path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            pathLength={1}
            strokeDasharray="1 1"
            animate={{ strokeDashoffset: [1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          />
        )}
      </svg>
    </div>
  )
}

function EmotionViz({ active, reduce }: { active: boolean; reduce: boolean }) {
  const animate = active && !reduce
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!animate) {
      setFrame(0)
      return
    }
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % EMOTION_FRAMES.length)
    }, 1600)
    return () => window.clearInterval(id)
  }, [animate])

  const probs = EMOTION_FRAMES[frame]

  return (
    <ul className="flex h-full w-full flex-col justify-center gap-2">
      {EMOTION_LABELS.map((label, i) => (
        <li key={label} className="grid grid-cols-[72px_1fr_36px] items-center gap-2">
          <span className="font-mono text-[11px] text-ink-2">{label}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-bar-track">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${Math.round(probs[i] * 100)}%` }}
              transition={animate ? { duration: 0.85, ease: EASE } : { duration: 0 }}
            />
          </div>
          <span className="text-right font-mono text-[10px] tabular-nums text-ink-3">
            {Math.round(probs[i] * 100)}%
          </span>
        </li>
      ))}
    </ul>
  )
}

const SIGNAL_CARDS = [
  {
    title: 'Face geometry',
    blurb: 'Smile, brow, and gaze from blendshapes + head-pose matrix — relative to a personal baseline.',
    Viz: MeshViz,
  },
  {
    title: 'The Tell',
    blurb: 'Pulse and arousal recovered from skin-colour change in a facial ROI. Experimental, confidence-tagged.',
    Viz: RppgViz,
  },
  {
    title: 'Soft emotion',
    blurb: 'Six hedged states from face cues. Relative probabilities — never a diagnosis.',
    Viz: EmotionViz,
  },
] as const

export function SignalsSection() {
  const reduce = !!useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: false, amount: 0.25 })

  return (
    <section ref={ref} className="relative left-[50%] right-[50%] mx-[-50vw] w-[100vw] bg-paper py-28 px-7">
      <div className="mx-auto max-w-[1160px]">
        <motion.div
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="mx-auto max-w-[560px] text-center"
        >
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-ink-3">Three signals, one read</span>
          <h2 className="mt-4 font-sans text-[28px] md:text-[36px] font-medium leading-[1.1] tracking-tight text-ink">
            Not one prompt. Three local channels.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] font-sans text-[16px] leading-relaxed text-ink-2">
            Geometry, body, and soft emotion — fused, baselined, and confidence-tagged on your laptop before anything
            reaches the cloud. Relative reads for people who need the social channel made legible — never a diagnosis.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {SIGNAL_CARDS.map(({ title, blurb, Viz }) => (
            <motion.article
              key={title}
              variants={rise}
              className="flex flex-col rounded-xl bg-white p-6 md:p-7"
            >
              <h3 className="font-sans text-[17px] font-medium text-ink">{title}</h3>
              <div className="mt-5 h-[168px] text-ink">
                <Viz active={inView} reduce={reduce} />
              </div>
              <p className="mt-5 font-sans text-[14px] leading-relaxed text-ink-2">{blurb}</p>
              <p className="mt-3 font-mono text-[11px] text-ink-3">relative · confidence-tagged · never a diagnosis</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* -------------------------------------------------- DigitalOcean section */

const DO_SERVICES = [
  {
    title: 'Gradient AI',
    detail: 'Haiku 4.5 phrases the live nudge via forced tool-call. Sonnet 4.6 streams the debrief over SSE.',
    glyph: CloudGlyph,
  },
  {
    title: 'Managed Postgres',
    detail: 'Sessions and ~1 Hz signal frames persisted for the annotated timeline — never raw video.',
    glyph: DbGlyph,
  },
  {
    title: 'App Platform',
    detail: 'One Docker image serves the React client and Express API. Migrations run on container start.',
    glyph: DeployGlyph,
  },
  {
    title: 'Key stays server-side',
    detail: 'The inference key never reaches the browser. CORS locked; the laptop only sends derived signals.',
    glyph: KeyGlyph,
  },
] as const

export function DigitalOceanSection() {
  return (
    <section className="relative left-[50%] right-[50%] mx-[-50vw] w-[100vw] bg-paper-2 py-28 px-7">
      <div className="mx-auto max-w-[1160px]">
        <motion.div
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="mx-auto max-w-[560px] text-center"
        >
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-ink-3">Built on DigitalOcean</span>
          <h2 className="mt-4 font-sans text-[28px] md:text-[36px] font-medium leading-[1.1] tracking-tight text-ink">
            Inference, data, and deploy — one cloud.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] font-sans text-[16px] leading-relaxed text-ink-2">
            Wavelength runs entirely on DigitalOcean. Gradient powers the language; Postgres holds the timeline; App
            Platform ships the whole stack.
          </p>
          <p className="mt-4 font-mono text-[12px] text-ink-3">live · wavelength-wxut4.ondigitalocean.app</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          {DO_SERVICES.map(({ title, detail, glyph: Glyph }) => (
            <motion.article
              key={title}
              variants={rise}
              className="flex items-start gap-4 rounded-xl bg-white p-6 md:p-8"
            >
              <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Glyph />
              </span>
              <div>
                <h3 className="font-sans text-[17px] font-medium text-ink">{title}</h3>
                <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink-2">{detail}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- export */

export default function PitchDeck() {
  return (
    <>
      <PipelineSection />
      <SignalsSection />
      <DigitalOceanSection />
    </>
  )
}
