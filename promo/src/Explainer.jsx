// The explainer cut (Metro Manila only): say what Barker is in the first 5 seconds, show it in three numbered
// steps with screens big enough to read on a phone, and end on what it does. No link: the user asked for none.
// 44 s at 30 fps; every scene starts on a bar of the 120 BPM beat (60 frames = 2 s).
import { useEffect, useState } from 'react'
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolate } from 'remotion'
import { ARROW, AreaCtx, C, CHECK, DISPLAY, EIO, Icon, PIN, Phone, Plakard, SANS, rise, sp, tw, useF, useTall } from './ui.jsx'
import { AlertScreen, AskScreen, ScanScreen, project } from './screens.jsx'
import data from './data.json'

export const EXPLAINER_DURATION = 1320
const T = {
  problem: [0, 120],
  meet: [120, 180],
  ask: [300, 180],
  answer: [480, 240],
  alert: [720, 180],
  scan: [900, 120],
  cover: [1020, 120],
  end: [1140, 180],
}
const BG = `radial-gradient(circle at 50% 28%, #24211b 0%, ${C.night} 62%)`
const TICKET = 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12'

/** Where the moving pictures go: below the caption on a tall frame, the right side on a wide one. */
const useStage = () => {
  const tall = useTall()
  return tall
    ? { tall, box: { left: 0, right: 0, top: 500, bottom: 0 }, w: 1080, px: 540, py: 560 }
    : { tall, box: { left: 900, right: 0, top: 0, bottom: 0 }, w: 1020, px: 510, py: 540 }
}
function Stage({ children }) {
  const { box } = useStage()
  // A soft top edge, so a zoomed phone slides under the caption instead of cutting into it.
  return (
    <div style={{ position: 'absolute', ...box, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, transparent 0, #000 48px)' }}>
      {children}
    </div>
  )
}

/** Camera keys: [frame, scale, focusX, focusY] in phone pixels. The focus point is held at the stage's centre. */
const camAt = (f, keys) =>
  [1, 2, 3].map((i) =>
    interpolate(
      f,
      keys.map((k) => k[0]),
      keys.map((k) => k[i]),
      { easing: EIO, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    ),
  )
function CamPhone({ keys, shake = 0, children }) {
  const [f] = useF()
  const { px, py } = useStage()
  const [s, fx, fy] = camAt(f, keys)
  return (
    <Phone style={{ left: px - fx * s, top: py - fy * s, right: 'auto', transform: `scale(${s}) rotate(${shake}deg)` }}>{children}</Phone>
  )
}

/** The step headline: a numbered chip and one plain sentence, with a short line under it. */
function StepCaption({ n, title, sub, accent = [], wideTop }) {
  const [f] = useF()
  const tall = useTall()
  const words = title.split(' ')
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        gap: tall ? 28 : 0,
        ...(tall
          ? { left: 72, right: 72, top: 205, alignItems: 'flex-start' }
          : {
              left: 110,
              width: 760,
              flexDirection: 'column',
              ...(wideTop ? { top: wideTop } : { top: 0, bottom: 0, justifyContent: 'center' }),
            }),
      }}
    >
      {n && (
        <div
          style={{
            flex: 'none',
            display: 'grid',
            placeItems: 'center',
            width: tall ? 104 : 96,
            height: tall ? 104 : 96,
            marginBottom: tall ? 0 : 26,
            borderRadius: 99,
            background: C.yellow,
            color: C.ink,
            font: `${tall ? 66 : 62}px/1 ${DISPLAY}`,
            opacity: tw(f, 0, 6, 0, 1),
            transform: `scale(${tw(f, 0, 10, 0.9, 1)})`,
          }}
        >
          {n}
        </div>
      )}
      <div>
        <h1 style={{ margin: 0, font: `${tall ? 92 : 104}px/1 ${DISPLAY}`, color: C.cream, textTransform: 'uppercase' }}>
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.22em',
                color: accent.includes(w) ? C.yellow : C.cream,
                ...rise(f, 3 + i * 2, 30, 12),
              }}
            >
              {w}
            </span>
          ))}
        </h1>
        {sub && (
          <p
            style={{
              margin: '18px 0 0',
              font: `500 ${tall ? 40 : 38}px/1.3 ${SANS}`,
              color: '#d6cdbd',
              textWrap: 'balance',
              ...rise(f, 12, 20, 14),
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

/** A small "BARKER · Metro Manila" tag that stays on screen through the steps, so the name is never off screen. */
function BrandBug() {
  const tall = useTall()
  return (
    <div
      style={{
        position: 'absolute',
        ...(tall ? { left: 0, right: 0, top: 1556, display: 'flex', justifyContent: 'center' } : { left: 110, top: 984 }),
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 12,
          padding: '12px 22px',
          borderRadius: 99,
          background: 'rgb(18 17 14 / .88)',
          border: '2px solid #3a352c',
        }}
      >
        <b style={{ font: `30px/1 ${DISPLAY}`, color: '#ff4a5f', letterSpacing: 1 }}>BARKER</b>
        <span style={{ font: `600 24px/1 ${SANS}`, color: C.cream }}>Metro Manila</span>
      </span>
    </div>
  )
}

// Real Metro Manila jeep signboards from the app's data.
const BOARDS = [
  ['Cubao', 'Divisoria'],
  ['Baclaran', 'Dapitan'],
  ['Quiapo', 'Divisoria'],
  ['Alabang', 'Zapote'],
  ['Crame', 'Cubao'],
  ['Balara', 'Philcoa'],
  ['Gil Puyat', 'PITX'],
  ['Arroceros', 'Project 7'],
  ['Baclaran', 'Blumentritt'],
  ['Guadalupe', 'L. Guinto'],
  ['Cogeo', 'Cubao'],
  ['Ayala', 'Washington'],
  ['Baclaran', 'Sucat'],
  ['Cubao', 'Rosario'],
  ['A. Rivera', 'Raon'],
]

function Problem() {
  const [f] = useF()
  const tall = useTall()
  const qs = [
    ['Which jeep?', 12],
    ['Which bus?', 26],
    ['Where do I wait?', 40],
  ]
  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Rows of signboards sliding past: too many choices, none of them obvious. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: tall ? 1010 : 640, display: 'grid', gap: tall ? 34 : 26, opacity: 0.5 }}>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              gap: 24,
              width: 'max-content',
              transform: `translateX(${(row % 2 ? -1 : 1) * f * 4 - 600 - row * 180}px)`,
            }}
          >
            {[...BOARDS.slice(row * 5), ...BOARDS].slice(0, 9).map(([a, b], i) => (
              <Plakard key={i} small a={a} b={b} zoom={tall ? 1.55 : 1.35} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', ...(tall ? { left: 72, right: 72, top: 220 } : { left: 110, right: 110, top: 110 }) }}>
        <p style={{ margin: '0 0 22px', font: `600 ${tall ? 48 : 46}px/1.25 ${SANS}`, color: '#d6cdbd', ...rise(f, 0, 20, 12) }}>
          Going somewhere new in Metro Manila?
        </p>
        {qs.map(([q, at]) => (
          <div
            key={q}
            style={{
              font: `${tall ? (q.length > 12 ? 124 : 150) : 120}px/1 ${DISPLAY}`,
              color: C.cream,
              textTransform: 'uppercase',
              marginBottom: tall ? 10 : 4,
              ...rise(f, at, 40, 12),
            }}
          >
            {q.slice(0, -1)}
            <span style={{ color: C.yellow }}>?</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

function Meet() {
  const [f, fps] = useF()
  const tall = useTall()
  const s = sp(f, fps, 0)
  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '0 70px',
      }}
    >
      <p
        style={{
          margin: 0,
          font: `600 ${tall ? 44 : 40}px/1 ${SANS}`,
          color: '#d6cdbd',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          opacity: tw(f, 0, 8, 0, 1),
        }}
      >
        Meet
      </p>
      <div
        style={{
          margin: tall ? '10px 0 34px' : '6px 0 26px',
          font: `${tall ? 250 : 230}px/0.9 ${DISPLAY}`,
          color: '#ff4a5f',
          letterSpacing: 4,
          transform: `scale(${1.2 - 0.2 * s}) rotate(${-5 + 3 * s}deg)`,
          opacity: tw(f, 0, 4, 0, 1),
        }}
      >
        BARKER
      </div>
      <p
        style={{
          margin: 0,
          maxWidth: tall ? 940 : 1300,
          font: `700 ${tall ? 60 : 58}px/1.18 ${SANS}`,
          color: C.cream,
          textWrap: 'balance',
          ...rise(f, 16, 24, 14),
        }}
      >
        The free app that tells you which jeep, bus or train to take.
      </p>
      <p
        style={{
          margin: tall ? '30px 0 0' : '22px 0 0',
          maxWidth: tall ? 900 : 1200,
          font: `500 ${tall ? 36 : 34}px/1.35 ${SANS}`,
          color: '#a89f8f',
          textWrap: 'balance',
          ...rise(f, 40, 20, 14),
        }}
      >
        Named after the terminal barker who calls out where each jeep goes.
      </p>
      <div style={{ display: 'flex', gap: 16, marginTop: tall ? 44 : 32, ...rise(f, 60, 20, 14) }}>
        {['Metro Manila', 'Free', 'No sign-up'].map((t) => (
          <span
            key={t}
            style={{
              padding: '14px 26px',
              borderRadius: 99,
              border: `3px solid ${C.cream}`,
              font: `700 ${tall ? 34 : 30}px/1 ${SANS}`,
              color: C.cream,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  )
}

const Row = ({ icon, children, f, at }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, font: `600 17px/1.3 ${SANS}`, ...rise(f, at, 14, 12) }}>
    <span
      style={{
        flex: 'none',
        width: 32,
        height: 32,
        borderRadius: 99,
        background: C.ink,
        color: C.bg,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Icon d={icon} size={17} />
    </span>
    <span>{children}</span>
  </div>
)

/** Step 2: the answer, lifted out of the phone and made big. Drawn at app size and zoomed as a whole. */
function Answer() {
  const [f] = useF()
  const tall = useTall()
  const zoom = tall ? 2.3 : 2.2
  const ride = tw(f, 14, 10, 0, 1)
  return (
    <AbsoluteFill style={{ background: BG }}>
      <StepCaption
        n="2"
        title="Barker tells you what to ride."
        sub="Which train or jeep, where to get on, which way, and the fare."
        accent={['ride.']}
      />
      <Stage>
        {/* Centred by a flex wrapper: CSS zoom would also scale a centring margin. */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: tall ? 40 : 46, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 390,
              zoom,
              padding: 18,
              borderRadius: 18,
              background: C.bg,
              color: C.ink,
              font: `16px/1.5 ${SANS}`, // the page default is a serif font
              boxShadow: '0 20px 40px rgb(0 0 0 / .45)',
              ...rise(f, 0, 30, 14),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: `700 13px/1 ${SANS}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted }}>
                To Ayala
              </span>
              <span style={{ padding: '6px 12px', borderRadius: 99, border: `2px solid ${C.ink}`, fontSize: 13 }}>
                From <b>Cubao</b>
              </span>
            </div>
            <div style={{ position: 'relative', marginTop: 20, ...rise(f, 6, 16, 12) }}>
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  top: -12,
                  zIndex: 1,
                  padding: '4px 8px',
                  borderRadius: 99,
                  background: C.yellow,
                  border: `2px solid ${C.ink}`,
                  font: `700 11px/1 ${SANS}`,
                  letterSpacing: '.08em',
                  opacity: ride,
                  transform: `scale(${0.9 + 0.1 * ride})`,
                }}
              >
                RIDE THIS
              </span>
              <Plakard
                small
                zoom={1.22}
                a="North Avenue"
                b="Taft Avenue"
                badge="MRT-3"
                kind="rail"
                style={{ outline: `3px solid rgb(243 184 31 / ${ride * tw(f, 30, 16, 1, 0)})`, outlineOffset: 3 }}
              />
            </div>
            <Row icon={PIN} f={f} at={36}>
              Get on at <b>Cubao</b> station
            </Row>
            <Row icon={ARROW} f={f} at={58}>
              Ride toward <b style={{ color: C.red }}>TAFT AVENUE</b>
            </Row>
            <Row icon={TICKET} f={f} at={80}>
              Pay at the station or tap a beep card
            </Row>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 14,
                background: C.surface,
                border: `2px solid ${C.line}`,
                ...rise(f, 120, 24, 14),
              }}
            >
              <div
                style={{ font: `700 12px/1 ${SANS}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 14 }}
              >
                Or take the bus
              </div>
              <Plakard small a="Monumento" b="PITX" badge="Bus 1" kind="bus" />
              <div style={{ marginTop: 10, font: `600 17px/1.3 ${SANS}` }}>
                Fare about <b style={{ color: C.red }}>₱27.50–₱33</b>
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>₱22–₱26.50 for students, seniors and PWD</div>
            </div>
          </div>
        </div>
      </Stage>
    </AbsoluteFill>
  )
}

function Coverage() {
  const [f] = useF()
  const tall = useTall()
  const H = tall ? 1000 : 900
  const W = (H * (0.2 * Math.cos((14.6 * Math.PI) / 180))) / 0.38
  const xy = project(W, H)
  const n = data.spots.length
  const order = new Map(
    data.spots
      .map((s, i) => [s, i])
      .sort((a, b) => b[0][0] - a[0][0])
      .map(([, i], r) => [i, r]),
  )
  const kinds = { train: [C.cream, 8], terminal: [C.yellow, 5.5], trike: [C.trike, 4] }
  const stats = [
    [data.counts.rail, 'train lines', 'LRT-1 · LRT-2 · MRT-3'],
    [data.counts.routes, 'routes', 'Trains, jeeps, buses, UV, P2P'],
    [data.counts.spots, 'ride spots', 'Stations, terminals, tricycles'],
  ]
  return (
    <AbsoluteFill style={{ background: BG }}>
      <StepCaption title="Across Metro Manila." accent={['Manila.']} wideTop={120} />
      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', overflow: 'visible', ...(tall ? { left: 50, top: 560 } : { left: 1920 - 150 - W, top: 90 }) }}
      >
        {data.spots.map(([la, ln, t], i) => {
          const [x, y] = xy(la, ln)
          const at = 2 + (order.get(i) / n) * 30
          const [fill, r] = kinds[t]
          return (
            <circle key={i} cx={x} cy={y - tw(f, at, 8, 24, 0)} r={r} fill={fill} opacity={tw(f, at, 8, 0, t === 'trike' ? 0.85 : 1)} />
          )
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          display: 'grid',
          ...(tall ? { left: 50 + W + 50, right: 40, top: 640, gap: 50 } : { left: 110, top: 400, gridTemplateColumns: 'repeat(3, auto)', columnGap: 64 }), // side by side, clear of the tag
        }}
      >
        {stats.map(([v, label, sub], i) => (
          <div key={label} style={{ ...rise(f, 6 + i * 6, 26, 12), maxWidth: tall ? 'none' : 330 }}>
            <div style={{ font: `${tall ? 124 : 104}px/0.95 ${DISPLAY}`, color: C.yellow }}>{Math.round(tw(f, 6 + i * 6, 36, 0, v))}</div>
            <div
              style={{ font: `700 ${tall ? 34 : 32}px/1.2 ${SANS}`, color: C.cream, textTransform: 'uppercase', letterSpacing: '.05em' }}
            >
              {label}
            </div>
            <div style={{ font: `500 ${tall ? 28 : 26}px/1.3 ${SANS}`, color: '#a89f8f' }}>{sub}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

function End() {
  const [f, fps] = useF()
  const tall = useTall()
  const r = tw(f, 0, 16, 0, 150, EIO)
  const s = sp(f, fps, 6)
  const recap = ['Which jeep, bus or train to take', 'Where to get on, and which way', 'A buzz before your stop']
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill
        style={{
          background: C.red,
          clipPath: `circle(${r}% at 50% 50%)`,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: C.cream,
          textAlign: 'center',
          padding: '0 70px',
        }}
      >
        <div
          style={{
            font: `${tall ? 240 : 210}px/0.9 ${DISPLAY}`,
            letterSpacing: 4,
            transform: `scale(${1.2 - 0.2 * s}) rotate(${-5 + 3 * s}deg)`,
            opacity: tw(f, 6, 4, 0, 1),
          }}
        >
          BARKER
        </div>
        <p
          style={{
            margin: tall ? '26px 0 44px' : '18px 0 30px',
            font: `700 ${tall ? 52 : 48}px/1.2 ${SANS}`,
            textWrap: 'balance',
            ...rise(f, 16, 24),
          }}
        >
          The free commuter app for Metro Manila
        </p>
        <div style={{ display: 'grid', gap: tall ? 22 : 14, justifyItems: 'start' }}>
          {recap.map((t, i) => (
            <div
              key={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                font: `600 ${tall ? 42 : 38}px/1.2 ${SANS}`,
                ...rise(f, 26 + i * 6, 20),
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: tall ? 52 : 46,
                  height: tall ? 52 : 46,
                  borderRadius: 99,
                  background: C.cream,
                  color: C.red,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon d={CHECK} size={tall ? 32 : 28} stroke={3} />
              </span>
              {t}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: tall ? 54 : 36,
            padding: tall ? '20px 40px' : '16px 34px',
            borderRadius: 99,
            background: C.cream,
            color: C.red,
            font: `${tall ? 50 : 46}px/1 ${DISPLAY}`,
            textTransform: 'uppercase',
            letterSpacing: 1,
            boxShadow: `0 8px 0 ${C.redDeep}`,
            ...rise(f, 48, 24),
          }}
        >
          Free · No sign-up
        </div>
        <div style={{ marginTop: tall ? 60 : 34, font: `500 24px/1.3 ${SANS}`, color: 'rgb(243 237 225 / .75)', ...rise(f, 56, 12) }}>
          Map data © OpenStreetMap contributors
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

const ScreenAt = ({ Screen }) => {
  const [f] = useF()
  return <Screen f={f} />
}

function AskStep() {
  const { tall } = useStage()
  return (
    <AbsoluteFill style={{ background: BG }}>
      <StepCaption n="1" title="Say where you're going." sub="Type it, or just say it out loud." accent={['going.']} />
      <Stage>
        <CamPhone
          keys={
            tall
              ? [
                  [0, 1.55, 195, 360],
                  [14, 2.5, 195, 350],
                  [54, 2.5, 195, 350],
                  [76, 1.85, 195, 330],
                  [180, 1.85, 195, 330],
                ]
              : [
                  [0, 1.1, 195, 420],
                  [14, 1.9, 195, 350],
                  [54, 1.9, 195, 350],
                  [76, 1.45, 195, 360],
                  [180, 1.45, 195, 360],
                ]
          }
        >
          <ScreenAt Screen={AskScreen} />
        </CamPhone>
      </Stage>
      <BrandBug />
    </AbsoluteFill>
  )
}

function AlertStep() {
  const [f] = useF()
  const { tall } = useStage()
  // The phone buzzes when the alert turns green (AlertScreen's "here" phase starts at frame 102).
  const b = f - 102
  const shake = b >= 0 && b < 24 ? Math.sin(b * 2.6) * 2.4 * Math.exp(-b / 8) : 0
  return (
    <AbsoluteFill style={{ background: BG }}>
      <StepCaption n="3" title="Get a buzz before your stop." sub="So you never miss where to get off." accent={['buzz']} />
      <Stage>
        <CamPhone
          shake={shake}
          keys={
            tall
              ? [
                  [0, 1.7, 195, 250],
                  [20, 2.3, 195, 230],
                  [180, 2.3, 195, 230],
                ]
              : [
                  [0, 1.3, 195, 300],
                  [20, 1.85, 195, 240],
                  [180, 1.85, 195, 240],
                ]
          }
        >
          <ScreenAt Screen={AlertScreen} />
        </CamPhone>
      </Stage>
      <BrandBug />
    </AbsoluteFill>
  )
}

function ScanStep() {
  const { tall } = useStage()
  return (
    <AbsoluteFill style={{ background: BG }}>
      <StepCaption n="+" title="Scan a jeep's signboard." sub="See where it goes before you get on." accent={['signboard.']} />
      <Stage>
        <CamPhone
          keys={
            tall
              ? [
                  [0, 1.8, 195, 430],
                  [120, 1.8, 195, 430],
                ]
              : [
                  [0, 1.35, 195, 430],
                  [120, 1.35, 195, 430],
                ]
          }
        >
          <ScreenAt Screen={ScanScreen} />
        </CamPhone>
      </Stage>
      <BrandBug />
    </AbsoluteFill>
  )
}

function AnswerStep() {
  return (
    <>
      <Answer />
      <BrandBug />
    </>
  )
}
function CoverStep() {
  return (
    <>
      <Coverage />
      <BrandBug />
    </>
  )
}

export function Explainer() {
  // Wait for Anton so no frame renders in the fallback font.
  const [handle] = useState(() => delayRender('Loading Anton'))
  useEffect(() => {
    document.fonts.load('400 100px Anton').then(() => continueRender(handle))
  }, [handle])
  const scenes = {
    problem: Problem,
    meet: Meet,
    ask: AskStep,
    answer: AnswerStep,
    alert: AlertStep,
    scan: ScanStep,
    cover: CoverStep,
    end: End,
  }
  return (
    <AreaCtx.Provider value="manila">
      <AbsoluteFill style={{ background: C.night }}>
        {Object.entries(scenes).map(([k, Scene]) => (
          <Sequence key={k} from={T[k][0]} durationInFrames={T[k][1]}>
            <Scene />
          </Sequence>
        ))}
      </AbsoluteFill>
    </AreaCtx.Provider>
  )
}
