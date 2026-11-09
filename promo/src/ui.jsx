// Shared look and motion for the promo. Colours, sizes and the signboard mirror app/src/App.css and index.css.
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export const C = {
  bg: '#f4efe4',
  surface: '#fffaf0',
  ink: '#1b1813',
  muted: '#645d51',
  line: '#ddd4c3',
  red: '#c4122f',
  redDeep: '#7d0b1e',
  yellow: '#f3b81f',
  yes: '#1d7a3e',
  board: '#fff6d8',
  boardInk: '#b0102a',
  rail: '#5b2a86',
  bus: '#1f5fbf',
  trike: '#2fa36b',
  night: '#12110e',
  cream: '#f3ede1',
}
export const DISPLAY = "'Anton', Impact, sans-serif"
export const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

// Strong curves from the animate skill: ease-out for things arriving, ease-in-out for things moving on screen.
export const EO = Easing.bezier(0.23, 1, 0.32, 1)
export const EIO = Easing.bezier(0.77, 0, 0.175, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
/** Value going from `a` to `b` over `dur` frames starting at `start`. */
export const tw = (f, start, dur, a, b, easing = EO) => interpolate(f, [start, start + dur], [a, b], { ...clamp, easing })
/** A spring that starts at `start`: 0 -> 1 with a little overshoot when `bouncy`. */
export const sp = (f, fps, start, bouncy = false) =>
  spring({
    frame: f - start,
    fps,
    config: bouncy ? { damping: 11, stiffness: 170, mass: 0.9 } : { damping: 20, stiffness: 170, mass: 0.9 },
  })
/** Enter: rise 24px and fade in, the way the app's cards appear. */
export const rise = (f, start, dist = 24, dur = 12) => ({
  opacity: tw(f, start, dur, 0, 1),
  transform: `translateY(${tw(f, start, dur, dist, 0)}px)`,
})

export const useTall = () => {
  const { width, height } = useVideoConfig()
  return height > width
}
export const useF = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  return [f, fps]
}

/** The painted jeepney signboard: the app's signature element. */
// Drawn at the app's sizes; `zoom` scales the whole board (Chromium's CSS zoom keeps borders and text crisp).
export function Plakard({ a, b, badge, kind, small, zoom = 1, style }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px 12px',
        padding: small ? 12 : '20px 16px',
        textAlign: 'center',
        background: C.board,
        color: C.boardInk,
        border: `${small ? 3 : 4}px solid ${C.ink}`,
        borderRadius: 8,
        boxShadow: small ? '0 3px 0 rgb(0 0 0 / .12)' : `inset 0 0 0 3px ${C.board}, inset 0 0 0 5px ${C.ink}, 0 4px 0 rgb(0 0 0 / .15)`,
        font: `${small ? 21 : 34}px/1.05 ${DISPLAY}`,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        zoom,
        ...style,
      }}
    >
      <span>{a}</span>
      {b && <span style={{ width: small ? 14 : 22, height: small ? 4 : 5, background: C.ink, borderRadius: 2 }} />}
      {b && <span>{b}</span>}
      {badge && (
        <em
          style={{
            position: 'absolute',
            top: -12,
            right: 10,
            font: `700 11px/1 ${SANS}`,
            fontStyle: 'normal',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            background: kind === 'rail' ? C.rail : kind === 'bus' ? C.bus : C.yellow,
            color: kind === 'rail' || kind === 'bus' ? '#fff' : C.ink,
            padding: '4px 8px',
            borderRadius: 99,
            border: `2px solid ${C.ink}`,
          }}
        >
          {badge}
        </em>
      )}
    </div>
  )
}

/** App header inside the phone: BARKER and the area pill. */
export const TopBar = ({ area = 'Metro Manila' }) => (
  // Sticky and opaque like the app's header, so scrolled content passes under it.
  <div
    style={{
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '0 -18px',
      padding: '54px 18px 10px',
      background: C.bg,
    }}
  >
    <span style={{ font: `28px/1 ${DISPLAY}`, color: C.red, letterSpacing: 0.5 }}>BARKER</span>
    <span style={{ font: `700 13px/1 ${SANS}`, padding: '9px 12px', borderRadius: 99, border: `2px solid ${C.ink}`, color: C.ink }}>
      {area} ▾
    </span>
  </div>
)

/** Bottom tab bar, as in the app. */
export const TabBar = ({ on }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      padding: '6px 8px 22px',
      background: C.bg,
      borderTop: `2px solid ${C.line}`,
    }}
  >
    {[
      ['ask', 'Ask', MIC],
      ['scan', 'Scan', CAMERA],
      ['hubs', 'Ride spots', PIN],
    ].map(([k, label, d]) => (
      <div
        key={k}
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: 2,
          padding: '8px 0',
          borderRadius: 14,
          background: on === k ? C.surface : 'none',
          color: on === k ? C.red : C.muted,
          font: `700 12px/1.2 ${SANS}`,
        }}
      >
        <Icon d={d} size={22} />
        {label}
      </div>
    ))}
  </div>
)

export const Icon = ({ d, size = 22, stroke = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
export const CAMERA = 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
export const MIC = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3'
export const PIN = 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
export const ARROW = 'M5 12h14M13 6l6 6-6 6'
export const CHECK = 'M5 12.5l4.5 4.5L19 7'
export const BELL = 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0'

/** Big caption: an Anton headline with an optional line of plain text under it. */
export function Caption({ title, sub, at = 0, accent }) {
  const [f] = useF()
  const tall = useTall()
  const words = title.split(' ')
  return (
    <div
      style={{
        position: 'absolute',
        ...(tall ? { left: 72, right: 72, top: 200 } : { left: 120, width: 760, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }),
      }}
    >
      <h1 style={{ margin: 0, font: `${tall ? 104 : 120}px/0.98 ${DISPLAY}`, color: C.cream, textTransform: 'uppercase', textWrap: 'balance' }}>
        {words.map((w, i) => (
          // Words arrive one after another, 2 frames apart, so the line reads as it lands.
          <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', ...rise(f, at + i * 2, 36, 12), color: accent?.includes(w) ? C.yellow : C.cream }}>
            {w}
          </span>
        ))}
      </h1>
      {sub && (
        <p style={{ margin: `${tall ? 22 : 28}px 0 0`, font: `500 40px/1.3 ${SANS}`, color: '#cfc6b6', textWrap: 'balance', ...rise(f, at + 8, 20, 14) }}>{sub}</p>
      )}
    </div>
  )
}

/** A phone, drawn at app size (390 x 844) and scaled to the frame. Children are the screen. */
export function Phone({ children, style, shake = 0 }) {
  const tall = useTall()
  const scale = tall ? 1.85 : 1.14
  return (
    <div
      style={{
        position: 'absolute',
        width: 390,
        height: 844,
        ...(tall ? { left: (1080 - 390 * scale) / 2, top: 560 } : { right: 230, top: (1080 - 844 * scale) / 2 }),
        transform: `scale(${scale}) rotate(${shake}deg)`,
        transformOrigin: 'top left',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -12,
          borderRadius: 60,
          background: '#0b0a08',
          boxShadow: '0 40px 80px rgb(0 0 0 / .55), inset 0 0 0 2px #2a2620',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 48, overflow: 'hidden', background: C.bg, color: C.ink, font: `16px/1.5 ${SANS}` }}>
        {children}
      </div>
      <div style={{ position: 'absolute', top: 10, left: 140, width: 110, height: 30, borderRadius: 99, background: '#0b0a08' }} />
    </div>
  )
}
