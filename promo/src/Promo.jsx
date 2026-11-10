// The 35-second promo: hook, logo, five phone scenes, the ride-spot map, outro. Timings are in frames at 30 fps.
import { useEffect, useState } from 'react'
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolateColors } from 'remotion'
import { AreaCtx, C, Caption, DISPLAY, EIO, Phone, Plakard, SANS, rise, sp, tw, useF, useManila, useTall } from './ui.jsx'
import { AlertScreen, AskScreen, RouteScreen, ScanScreen, TowardScreen, project } from './screens.jsx'
import data from './data.json'

export const FPS = 30
export const DURATION = 1050
const ACT = { hook: [0, 90], logo: [90, 60], phone: [150, 690], spots: [840, 90], outro: [930, 120] }
// Inside the phone act, frames from its start.
const SCREENS = [
  { start: 0, dur: 150, Screen: AskScreen, cap: ['Just ask.', "Say where you're going. Barker tells you what to ride."], accent: ['ask.'] },
  {
    start: 150,
    dur: 120,
    Screen: TowardScreen,
    cap: ['Know which way to wait.', 'Which platform, or which side of the road.'],
    accent: ['way'],
  },
  { start: 270, dur: 150, Screen: RouteScreen, cap: ['See every stop.', 'Where to get on. Where to get off.'], accent: ['every'] },
  {
    start: 420,
    dur: 150,
    Screen: AlertScreen,
    cap: ['It tells you when to get off.', 'Para po! Your phone buzzes before your stop.'],
    accent: ['when'],
  },
  {
    start: 570,
    dur: 120,
    Screen: ScanScreen,
    cap: ['Scan the signboard.', 'Point your camera at a jeep. See where it goes.'],
    accent: ['signboard.'],
  },
]
const PLACES = [
  'CUBAO',
  'AYALA',
  'PITX',
  'QUIAPO',
  'BACLARAN',
  'ALABANG',
  'MONUMENTO',
  'LAWTON',
  'IMUS',
  'BACOOR',
  'ZAPOTE',
  'MOLINO',
  'FAIRVIEW',
  'TAFT',
]
// The Manila cut drifts Manila names only.
const MNL = ['CUBAO', 'AYALA', 'PITX', 'QUIAPO', 'BACLARAN', 'ALABANG', 'MONUMENTO', 'LAWTON', 'DIVISORIA', 'GUADALUPE', 'ORTIGAS', 'BUENDIA', 'FAIRVIEW', 'TAFT']

/** Faint destination names drifting past, like a terminal full of signboards. */
function Marquee({ f, opacity = 0.06 }) {
  const places = useManila() ? MNL : PLACES
  return (
    <AbsoluteFill style={{ overflow: 'hidden', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: 12 }, (_, row) => {
        const names = [...places.slice(row % places.length), ...places].join('  ·  ')
        const dir = row % 2 ? 1 : -1
        return (
          <div
            key={row}
            style={{
              whiteSpace: 'nowrap',
              font: `140px/1 ${DISPLAY}`,
              color: `rgb(243 237 225 / ${opacity})`,
              transform: `translateX(${dir * (f * 3 + row * 90) - 1200}px)`,
            }}
          >
            {names}
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

function Hook() {
  const [f, fps] = useF()
  const tall = useTall()
  const s = sp(f, fps, 2, true)
  // The board drops in and lands with a jolt; the frame shakes once on impact.
  const hit = Math.max(0, f - 12)
  const shake = f >= 12 ? Math.sin(hit * 2.2) * 14 * Math.exp(-hit / 4) : 0
  const ink = interpolateColors(tw(f, 12, 30, 0, 1), [0, 1], ['#ff3b55', C.boardInk])
  return (
    <AbsoluteFill style={{ background: C.night, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Marquee f={f} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 56 }}>
        <div
          style={{
            transform: `translateY(${(1 - s) * -320}px) scale(${1 + (1 - s) * 0.35}) rotate(${-2 - (1 - s) * 5}deg)`,
            opacity: tw(f, 2, 4, 0, 1),
          }}
        >
          <Plakard
            a={
              <>
                Which ride
                <br />
                gets me there?
              </>
            }
            zoom={tall ? 3 : 2.6}
            style={{ color: ink, padding: '24px 30px', lineHeight: 1 }}
          />
        </div>
        <p style={{ margin: 0, font: `500 ${tall ? 44 : 40}px/1.3 ${SANS}`, color: '#cfc6b6', ...rise(f, 34, 24, 14) }}>
          The question at every terminal.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function Logo() {
  const [f, fps] = useF()
  const tall = useTall()
  const s = sp(f, fps, 0)
  const ray = (side) =>
    [0, 1, 2].map((i) => (
      <div
        key={side + i}
        style={{
          position: 'absolute',
          top: `${36 + i * 14}%`,
          [side]: tall ? -110 : -150,
          width: tall ? 80 : 110,
          height: 12,
          borderRadius: 6,
          background: C.yellow,
          transform: `rotate(${(i - 1) * (side === 'left' ? -18 : 18)}deg) scaleX(${tw(f, 6 + i * 2, 10, 0.2, 1)})`,
          transformOrigin: side === 'left' ? 'right' : 'left',
          opacity: tw(f, 6 + i * 2, 4, 0, 1) * tw(f, 34, 10, 1, 0),
        }}
      />
    ))
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Marquee f={f + 90} opacity={0.04} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34 }}>
        <div style={{ position: 'relative', transform: `scale(${1.25 - 0.25 * s}) rotate(${-7 + 4 * s}deg)`, opacity: tw(f, 0, 4, 0, 1) }}>
          <span style={{ font: `${tall ? 270 : 300}px/0.9 ${DISPLAY}`, color: '#ff4a5f', letterSpacing: 4 }}>BARKER</span>
          {ray('left')}
          {ray('right')}
        </div>
        <p style={{ margin: 0, font: `600 ${tall ? 54 : 52}px/1.2 ${SANS}`, color: C.cream, ...rise(f, 14, 24, 14) }}>
          The barker in your pocket.
        </p>
        <p
          style={{ margin: 0, font: `500 ${tall ? 36 : 34}px/1.3 ${SANS}`, color: '#a89f8f', textAlign: 'center', ...rise(f, 20, 20, 14) }}
        >
          {useManila() ? 'A free commuter app for Metro Manila' : 'A free commuter app for Metro Manila and Cavite'}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Slides one screen in over the last: from the right for a new page, from below for the next part of the same page. */
function Slide({ children, from, dur, last }) {
  const [f] = useF()
  const inX = from === 'right' ? tw(f, 0, 12, 100, 0, EIO) : 0
  const inY = from === 'below' ? tw(f, 0, 12, 100, 0, EIO) : 0
  const out = last ? 0 : tw(f, dur, 12, 0, 1, EIO)
  return (
    <AbsoluteFill style={{ transform: `translate(${inX - out * 30}%, ${inY}%)`, filter: `brightness(${1 - out * 0.25})` }}>
      {children}
    </AbsoluteFill>
  )
}

function PhoneAct() {
  const [f] = useF()
  const enter = tw(f, 0, 20, 1, 0, EIO)
  // The phone buzzes when the alert says "you're here".
  const buzz = f - 522
  const shake = buzz >= 0 && buzz < 22 ? Math.sin(buzz * 2.6) * 2.2 * Math.exp(-buzz / 8) : 0
  const tall = useTall()
  // Where the phone sits (see Phone in ui.jsx): x, y, width, height in frame pixels.
  const ph = tall ? [(1080 - 390 * 1.85) / 2, 560, 390 * 1.85] : [1920 - 230 - 390 * 1.14, (1080 - 844 * 1.14) / 2, 390 * 1.14]
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Marquee f={f + 150} opacity={0.035} />
      {SCREENS.map((s, i) => (
        <Sequence key={i} from={s.start} durationInFrames={s.dur}>
          <Caption title={s.cap[0]} sub={s.cap[1]} accent={s.accent} />
        </Sequence>
      ))}
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${enter * 700}px)`, opacity: tw(f, 0, 8, 0, 1) }}>
        {buzz >= 0 && buzz < 26 && (
          <AbsoluteFill style={{ pointerEvents: 'none' }}>
            {[-1, 1].map((side) => (
              <div
                key={side}
                style={{
                  position: 'absolute',
                  top: ph[1] + (tall ? 260 : 180),
                  left: side < 0 ? ph[0] - 84 : ph[0] + ph[2] + 24,
                  width: 60,
                  height: 220,
                  borderRadius: 99,
                  border: `8px solid ${C.yellow}`,
                  borderColor:
                    side < 0 ? `transparent transparent transparent ${C.yellow}` : `transparent ${C.yellow} transparent transparent`,
                  opacity: tw(buzz, 0, 4, 0, 1) * tw(buzz, 14, 10, 1, 0),
                  transform: `scale(${tw(buzz, 0, 20, 0.9, 1.15)})`,
                }}
              />
            ))}
          </AbsoluteFill>
        )}
        <Phone shake={shake}>
          {SCREENS.map(({ start, dur, Screen }, i) => (
            <Sequence key={i} from={start} durationInFrames={dur + (i < SCREENS.length - 1 ? 12 : 0)}>
              <Slide from={i === 0 ? null : i === 1 || i === 4 ? 'right' : 'below'} dur={dur} last={i === SCREENS.length - 1}>
                <ScreenAt Screen={Screen} />
              </Slide>
            </Sequence>
          ))}
        </Phone>
      </div>
    </AbsoluteFill>
  )
}
const ScreenAt = ({ Screen }) => {
  const [f] = useF()
  return <Screen f={f} />
}

function Spots() {
  const [f] = useF()
  const tall = useTall()
  const H = tall ? 1140 : 900
  const W = (H * (0.2 * Math.cos((14.6 * Math.PI) / 180))) / 0.38
  const xy = project(W, H)
  const order = data.spots.map((s, i) => [s, i]).sort((a, b) => b[0][0] - a[0][0])
  const rank = new Map(order.map(([, i], r) => [i, r]))
  const n = data.spots.length
  const line = data.mrt.path
    .flat()
    .map(([la, ln]) => xy(la, ln).join(','))
    .join(' ')
  const kinds = { train: [C.cream, 8], terminal: [C.yellow, 5.5], trike: [C.trike, 4] }
  const stats = [
    [data.counts.rail, 'train lines'],
    [data.counts.routes, 'routes'],
    [data.counts.spots, 'ride spots'],
  ]
  const mapPos = tall ? { left: 60, top: 500 } : { left: 1920 - 180 - W, top: 90 }
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div style={{ position: 'absolute', ...(tall ? { left: 72, right: 72, top: 200 } : { left: 120, top: 150, width: 820 }) }}>
        <h1 style={{ margin: 0, font: `${tall ? 104 : 120}px/0.98 ${DISPLAY}`, color: C.cream, textTransform: 'uppercase' }}>
          {['Find', 'your', 'ride', 'spot.'].map((w, i) => (
            <span
              key={w}
              style={{
                display: 'inline-block',
                marginRight: '0.22em',
                color: w === 'spot.' ? C.yellow : C.cream,
                ...rise(f, i * 2, 36, 12),
              }}
            >
              {w}
            </span>
          ))}
        </h1>
      </div>
      <svg width={W} height={H} style={{ position: 'absolute', ...mapPos, overflow: 'visible' }}>
        {data.spots.map(([la, ln, t], i) => {
          const [x, y] = xy(la, ln)
          const at = 4 + (rank.get(i) / n) * 34
          const [fill, r] = kinds[t]
          return (
            <circle key={i} cx={x} cy={y - tw(f, at, 8, 26, 0)} r={r} fill={fill} opacity={tw(f, at, 8, 0, t === 'trike' ? 0.85 : 1)} />
          )
        })}
        <polyline
          points={line}
          fill="none"
          stroke="#ff4a5f"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={tw(f, 30, 26, 1, 0, EIO)}
        />
        <text x={W - 6} y={H + 44} textAnchor="end" style={{ font: `500 26px ${SANS}` }} fill="#8f8676" opacity={tw(f, 30, 10, 0, 1)}>
          Metro Manila · MRT-3 in red
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          display: 'grid',
          gap: tall ? 46 : 34,
          ...(tall ? { left: 60 + W + 60, top: 700 } : { left: 120, top: 520 }),
          ...(tall ? {} : { gridTemplateColumns: 'repeat(3, auto)', columnGap: 70 }),
        }}
      >
        {stats.map(([v, label], i) => (
          <div key={label} style={rise(f, 10 + i * 4, 30, 12)}>
            <div style={{ font: `${tall ? 130 : 120}px/0.95 ${DISPLAY}`, color: C.yellow, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(tw(f, 10 + i * 4, 40, 0, v))}
            </div>
            <div
              style={{ font: `600 ${tall ? 34 : 32}px/1.2 ${SANS}`, color: C.cream, textTransform: 'uppercase', letterSpacing: '.06em' }}
            >
              {label}
            </div>
          </div>
        ))}
        <div style={{ display: 'grid', gap: 12, marginTop: tall ? 10 : 0, gridColumn: tall ? 'auto' : '1 / -1', ...rise(f, 30, 20, 12) }}>
          {[
            [C.cream, 'Train stations'],
            [C.yellow, 'Terminals'],
            [C.trike, 'Tricycle stands'],
          ].map(([c, t]) => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, font: `500 28px/1 ${SANS}`, color: '#cfc6b6' }}>
              <span style={{ width: 18, height: 18, borderRadius: 99, background: c }} /> {t}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Outro() {
  const [f, fps] = useF()
  const tall = useTall()
  const r = tw(f, 0, 16, 0, 150, EIO)
  const s = sp(f, fps, 8)
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill
        style={{
          background: C.red,
          clipPath: `circle(${r}% at 50% 50%)`,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: tall ? 30 : 22,
          textAlign: 'center',
          color: C.cream,
        }}
      >
        <div
          style={{
            font: `${tall ? 250 : 240}px/0.9 ${DISPLAY}`,
            transform: `scale(${1.2 - 0.2 * s}) rotate(${-5 + 3 * s}deg)`,
            opacity: tw(f, 8, 4, 0, 1),
            letterSpacing: 4,
          }}
        >
          BARKER
        </div>
        <div style={{ font: `${tall ? 64 : 60}px/1.1 ${DISPLAY}`, textTransform: 'uppercase', ...rise(f, 18, 24) }}>
          {useManila() ? 'Made for Metro Manila' : 'Metro Manila · Cavite'}
        </div>
        <div style={{ font: `600 ${tall ? 40 : 38}px/1.3 ${SANS}`, ...rise(f, 22, 24) }}>Free · Open source · Works offline</div>
        <div
          style={{
            marginTop: tall ? 26 : 16,
            padding: tall ? '22px 40px' : '18px 36px',
            borderRadius: 99,
            background: C.cream,
            color: C.red,
            font: `700 ${tall ? 48 : 44}px/1 ${SANS}`,
            boxShadow: `0 8px 0 ${C.redDeep}`,
            ...rise(f, 28, 24),
          }}
        >
          barker-ph.vercel.app
        </div>
        <div style={{ marginTop: tall ? 40 : 24, font: `500 24px/1.3 ${SANS}`, color: 'rgb(243 237 225 / .75)', ...rise(f, 34, 12) }}>
          Map data © OpenStreetMap contributors
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function Promo({ area = 'all' }) {
  // Wait for Anton so no frame renders in the fallback font.
  const [handle] = useState(() => delayRender('Loading Anton'))
  useEffect(() => {
    document.fonts.load(`400 100px Anton`).then(() => continueRender(handle))
  }, [handle])
  return (
    <AreaCtx.Provider value={area}>
      <AbsoluteFill style={{ background: C.night }}>
        {Object.entries({ hook: Hook, logo: Logo, phone: PhoneAct, spots: Spots, outro: Outro }).map(([k, Scene]) => (
          <Sequence key={k} from={ACT[k][0]} durationInFrames={ACT[k][1]}>
            <Scene />
          </Sequence>
        ))}
      </AbsoluteFill>
    </AreaCtx.Provider>
  )
}
