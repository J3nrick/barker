// The app's screens, rebuilt from app/src/App.jsx and App.css so they animate frame by frame.
// Each takes `f`, the frame since that screen appeared.
import { interpolateColors } from 'remotion'
import { ARROW, BELL, C, CHECK, CAMERA, DISPLAY, EIO, Icon, MIC, Plakard, SANS, TabBar, TopBar, rise, tw } from './ui.jsx'
import data from './data.json'

const PAD = { position: 'absolute', inset: 0, padding: '0 18px' }
const h1 = { font: `44px/1.02 ${DISPLAY}`, textTransform: 'uppercase', margin: '14px 0 10px' }
const muted = { color: C.muted, fontSize: 16, margin: 0 }
const h2 = { font: `700 13px/1 ${SANS}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.muted, display: 'flex', gap: 8, alignItems: 'center', margin: '22px 0 12px' }
const count = { background: C.ink, color: C.bg, borderRadius: 99, padding: '2px 8px', letterSpacing: 0 }
const hint = { display: 'block', marginTop: 8, font: `600 14px/1.45 ${SANS}`, color: C.muted }
const farenote = { display: 'block', marginTop: 4, font: `600 14px/1.45 ${SANS}`, color: C.muted }
const B = ({ children, red }) => <b style={{ color: red ? C.red : C.ink }}>{children}</b>

function AskBar({ text, caret, listening, f, placeholder }) {
  const ring = listening ? (f % 30) / 30 : 0
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div
        style={{
          flex: 1,
          minHeight: 52,
          padding: '13px 16px',
          border: `2px solid ${text || caret ? C.ink : C.line}`,
          borderRadius: 14,
          background: C.surface,
          font: `600 17px/1.2 ${SANS}`,
          color: text ? C.ink : C.muted,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {text || placeholder}
        {caret && <span style={{ display: 'inline-block', width: 2, height: 20, marginLeft: 1, verticalAlign: -4, background: C.ink, opacity: f % 16 < 8 ? 1 : 0 }} />}
      </div>
      <div
        style={{
          width: 52,
          height: 52,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 14,
          background: C.red,
          color: '#fff',
          boxShadow: `0 4px 0 ${C.redDeep}${listening ? `, 0 0 0 ${8 * ring}px rgb(196 18 47 / ${0.35 * (1 - ring)})` : ''}`,
        }}
      >
        <Icon d={MIC} />
      </div>
      <div style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 14, border: `2px solid ${C.ink}`, background: C.surface }}>
        <Icon d={ARROW} />
      </div>
    </div>
  )
}

/** A finger tap: a soft ring that lands on the target. */
export const Tap = ({ f, at, x, y }) =>
  f >= at && f < at + 14 ? (
    <div
      style={{
        position: 'absolute',
        left: x - 26,
        top: y - 26,
        width: 52,
        height: 52,
        borderRadius: 99,
        background: 'rgb(27 24 19 / .18)',
        border: '3px solid rgb(27 24 19 / .5)',
        opacity: tw(f, at + 6, 8, 1, 0),
        transform: `scale(${tw(f, at, 6, 0.95, 1)})`,
      }}
    />
  ) : null

// Ask: voice fills the question word by word, the page scrolls up and the answers arrive, train first.
export function AskScreen({ f }) {
  const words = ['from', 'Cubao', 'to', 'Ayala']
  const heard = words.filter((_, i) => f >= 18 + i * 8).join(' ')
  const listening = f >= 6 && f < 52
  const up = tw(f, 56, 18, 0, 236, EIO)
  const press = f >= 126 && f < 132 ? 0.98 : 1
  return (
    <div style={PAD}>
      <TopBar />
      <div style={{ transform: `translateY(${-up}px)` }}>
        <h1 style={h1}>Where are you going?</h1>
        <p style={muted}>Ask by voice or type it. We'll tell you which train, jeep, bus or UV to take, and where to catch it.</p>
        <div style={{ font: `700 14px/1 ${SANS}`, margin: '20px 0 8px' }}>Ask</div>
        <AskBar f={f} text={heard} caret={f >= 52 && f < 60} listening={listening} placeholder="Where to? e.g. PITX" />
        <p style={{ ...muted, minHeight: 24, marginTop: 10, color: C.red, fontWeight: 700, opacity: listening ? 1 : 0 }}>Listening… say where you're going.</p>

        <div style={{ ...h2, ...rise(f, 62) }}>
          To Ayala <span style={count}>2</span>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 4px 4px 14px',
            borderRadius: 99,
            border: `2px solid ${C.ink}`,
            fontSize: 14,
            ...rise(f, 64),
          }}
        >
          From <b>Cubao</b>
          <span style={{ width: 28, height: 28, borderRadius: 99, background: C.ink, color: C.bg, display: 'grid', placeItems: 'center' }}>×</span>
        </div>
        <div style={{ marginTop: 22, ...rise(f, 68), transform: `${rise(f, 68).transform} scale(${press})` }}>
          <Plakard small a="North Avenue" b="Taft Avenue" badge="MRT-3" kind="rail" />
          <span style={hint}>
            Board at <B>Cubao</B> · right there · toward <B red>TAFT AVENUE</B>
            <span style={farenote}>Train fare depends on the stations. Pay at the station or tap a beep card.</span>
            <span style={{ display: 'block', marginTop: 6, color: C.red, fontWeight: 700 }}>See route →</span>
          </span>
        </div>
        <div style={{ marginTop: 22, ...rise(f, 72) }}>
          <Plakard small a="Monumento" b="PITX" badge="Bus 1" kind="bus" />
          <span style={hint}>
            Board at <B>Cubao</B> · right there · toward <B red>PITX</B>
            <span style={farenote}>Fare about ₱27.50–₱33 (₱22–₱26.50 student/senior/PWD)</span>
          </span>
        </div>
      </div>
      <Tap f={f} at={124} x={195} y={416} />
      <TabBar on="ask" />
    </div>
  )
}

// Route: the answer for Ayala, then the camera leans in on which platform to wait at.
export function TowardScreen({ f }) {
  const zoom = tw(f, 26, 22, 1, 1.18, EIO)
  const mark = tw(f, 48, 12, 0, 1)
  const note = 'Train fare depends on the stations. Pay at the station or tap a beep card.'
  const typed = note.slice(0, Math.round(tw(f, 62, 36, 0, note.length, (t) => t)))
  return (
    <div style={PAD}>
      <TopBar />
      <div style={{ transform: `scale(${zoom})`, transformOrigin: '50% 420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 18px' }}>
          <b style={{ color: C.red }}>← Back</b>
          <span style={{ font: `700 14px/1 ${SANS}`, padding: '10px 14px', borderRadius: 99, border: `2px solid ${C.ink}` }}>Share</span>
        </div>
        <Plakard a="North Avenue" b="Taft Avenue" badge="MRT-3" kind="rail" />
        <p style={{ ...muted, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
          Metro Rail Transit Corporation
          <br />A ride about every 4 min (per OpenStreetMap)
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            marginTop: 18,
            padding: 16,
            borderRadius: 14,
            background: C.yes,
            color: '#fff',
            opacity: tw(f, 4, 8, 0, 1),
            transform: `scale(${tw(f, 4, 10, 0.94, 1)})`,
          }}
        >
          <Icon d={CHECK} size={28} />
          <span>
            <strong style={{ display: 'block', font: `26px/1.1 ${DISPLAY}`, textTransform: 'uppercase', marginBottom: 4 }}>Yes, hop on!</strong>
            It passes near Ayala.
          </span>
        </div>
        <p style={{ margin: '12px 0 0', padding: '14px 16px', borderRadius: 14, border: `2px dashed ${C.ink}`, fontSize: 16, ...rise(f, 12, 16) }}>
          Wait at <b>Cubao</b>, on the platform for trains toward{' '}
          <b style={{ position: 'relative', color: C.red, whiteSpace: 'nowrap' }}>
            <span
              style={{
                position: 'absolute',
                inset: '-2px -4px',
                background: C.yellow,
                borderRadius: 4,
                zIndex: -1,
                transform: `scaleX(${mark})`,
                transformOrigin: 'left',
              }}
            />
            TAFT AVENUE
          </b>
          .<span style={{ ...farenote, marginTop: 8, minHeight: 42 }}>{typed}</span>
        </p>
      </div>
    </div>
  )
}

// Projects lat/lng into a w x h box around Metro Manila (flat is fine at city scale).
const BOX = { s: 14.4, n: 14.78, w: 120.93, e: 121.13 }
export const project = (w, h) => (lat, lng) => [((lng - BOX.w) / (BOX.e - BOX.w)) * w, ((BOX.n - lat) / (BOX.n - BOX.s)) * h]

// Route: the stop line draws down, you get on at Cubao and off at Ayala; then the map sheet draws the line.
export function RouteScreen({ f }) {
  const stops = data.mrt.stops
  const ON = stops.findIndex((s) => s.name === 'Cubao')
  const OFF = stops.findIndex((s) => s.name === 'Ayala')
  const fade = tw(f, 46, 12, 0, 1)
  const sheet = tw(f, 84, 18, 100, 0, EIO)
  // Map sheet: a 354 x 470 window onto the MRT-3 corridor.
  const W = 354
  const H = 470
  const box = { s: 14.53, n: 14.66, w: 120.97, e: 121.07 }
  const xy = (lat, lng) => [((lng - box.w) / (box.e - box.w)) * W, ((box.n - lat) / (box.n - box.s)) * H]
  const line = data.mrt.path.flat().map(([la, ln]) => xy(la, ln).join(',')).join(' ')
  const draw = tw(f, 92, 36, 1, 0, EIO)
  const near = data.spots.filter(([la, ln]) => la > box.s && la < box.n && ln > box.w && ln < box.e)
  const [cx, cy] = xy(stops[ON].lat, stops[ON].lng)
  return (
    <div style={PAD}>
      <TopBar />
      <div style={{ ...h2, marginTop: 10 }}>Stops along the way</div>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 9,
            top: 17,
            bottom: 17,
            width: 4,
            borderRadius: 2,
            background: C.red,
            transform: `scaleY(${tw(f, 0, 36, 0, 1, EIO)})`,
            transformOrigin: 'top',
          }}
        />
        {stops.map((s, i) => {
          const off = i === OFF
          const on = i === ON
          const out = i < ON || i > OFF
          const tag = off ? ['Get off', 50] : on ? ['Get on', 40] : null
          const dim = out ? fade : 0
          return (
            <div key={s.name} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, height: 34, fontSize: 17 }}>
              <span
                style={{
                  flex: 'none',
                  width: 14,
                  height: 14,
                  marginLeft: 2,
                  borderRadius: 99,
                  border: `3px solid ${off && f >= 50 ? C.yes : interpolateColors(dim, [0, 1], [C.ink, C.line])}`,
                  background: off && f >= 50 ? C.yes : on && f >= 40 ? C.ink : C.surface,
                  opacity: tw(f, 4 + i * 2, 8, 0, 1),
                  transform: `scale(${tw(f, 4 + i * 2, 8, 0.6, 1) * (off ? tw(f, 50, 10, 1, 1.3) : 1)})`,
                }}
              />
              <span
                style={{
                  fontWeight: (on && f >= 40) || (off && f >= 50) ? 700 : 400,
                  color: off && f >= 50 ? C.yes : interpolateColors(dim, [0, 1], [C.ink, C.muted]),
                  ...rise(f, 4 + i * 2, 8, 8),
                }}
              >
                {s.name}
              </span>
              {tag && (
                <span
                  style={{
                    font: `700 11px/1 ${SANS}`,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    borderRadius: 99,
                    background: off ? C.yes : C.ink,
                    color: '#fff',
                    opacity: tw(f, tag[1], 8, 0, 1),
                    transform: `scale(${tw(f, tag[1], 10, 0.9, 1)})`,
                  }}
                >
                  {tag[0]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 104,
          bottom: 0,
          padding: '18px 18px 0',
          background: C.bg,
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -12px 30px rgb(0 0 0 / .18)',
          transform: `translateY(${sheet}%)`,
        }}
      >
        <svg width={W} height={H} style={{ display: 'block', borderRadius: 14, border: `2px solid ${C.ink}`, background: '#e8e0cf' }}>
          {near.map(([la, ln], i) => {
            const [x, y] = xy(la, ln)
            return <circle key={i} cx={x} cy={y} r={2.2} fill="#b9ad97" />
          })}
          <polyline points={line} fill="none" stroke={C.ink} strokeOpacity={0.25} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
          <polyline points={line} fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
          {stops.map((s, i) => {
            const [x, y] = xy(s.lat, s.lng)
            const at = 92 + (i / (stops.length - 1)) * 36
            const off = i === OFF
            return (
              <circle
                key={s.name}
                cx={x}
                cy={y}
                r={off ? 9 : 5}
                fill={off ? C.yes : '#fff'}
                stroke={C.ink}
                strokeWidth={3}
                opacity={tw(f, at, 6, 0, 1)}
              />
            )
          })}
          <circle cx={cx} cy={cy} r={8} fill="#2b6cff" stroke={C.ink} strokeWidth={3} opacity={tw(f, 96, 8, 0, 1)} />
          {(() => {
            const [x, y] = xy(stops[OFF].lat, stops[OFF].lng)
            return (
              <g opacity={tw(f, 128, 8, 0, 1)}>
                <rect x={x + 14} y={y - 16} width={64} height={30} rx={6} fill="#fff" stroke={C.ink} strokeWidth={2} />
                <text x={x + 46} y={y + 4} textAnchor="middle" style={{ font: `700 15px ${SANS}` }} fill={C.ink}>
                  Ayala
                </text>
              </g>
            )
          })()}
        </svg>
        <p style={{ ...muted, fontSize: 14, marginTop: 10 }}>Line and stops from OpenStreetMap.</p>
      </div>
    </div>
  )
}

const PHASES = [
  { at: 16, key: 'riding', title: 'Riding to Ayala', bg: C.surface, fg: C.ink, from: 2400, to: 620, btn: 'Stop alert' },
  { at: 62, key: 'soon', title: 'Get ready to get off', bg: C.yellow, fg: C.ink, from: 480, to: 160, btn: 'Stop alert' },
  { at: 102, key: 'here', title: "You're here. Para po!", bg: C.yes, fg: '#fff', from: 40, to: 40, btn: 'Done' },
]
const fmt = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`)

// Get-off alert: press, then riding -> get ready (yellow) -> you're here (green), as RideAlert.jsx words it.
export function AlertScreen({ f }) {
  const i = Math.max(0, PHASES.findLastIndex((p) => f >= p.at)) // before the alert starts, show the first phase
  const p = PHASES[i]
  const next = PHASES[i + 1]
  const m = tw(f, p.at, (next?.at ?? 150) - p.at - 4, p.from, p.to, (t) => t)
  const pressed = f >= 8 && f < 14
  const pop = tw(f, p.at, 10, 0.96, 1)
  return (
    <div style={PAD}>
      <TopBar />
      <div style={{ ...h2, marginTop: 10 }}>North Avenue – Taft Avenue · MRT-3</div>
      {f < 16 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 72,
            marginTop: 14,
            borderRadius: 22,
            background: C.red,
            color: '#fff',
            font: `700 19px/1 ${SANS}`,
            boxShadow: `0 ${pressed ? 2 : 6}px 0 ${C.redDeep}`,
            transform: `translateY(${pressed ? 4 : 0}px)`,
          }}
        >
          <Icon d={BELL} size={24} /> Alert me before Ayala
        </div>
      ) : (
        <div style={{ position: 'relative', marginTop: 14 }}>
          {p.key === 'here' &&
            [0, 10].map((d) => (
              <div
                key={d}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 22,
                  border: `4px solid ${C.yes}`,
                  opacity: tw(f, 102 + d, 20, 0.6, 0),
                  transform: `scale(${tw(f, 102 + d, 20, 1, 1.18)})`,
                }}
              />
            ))}
          <div
            style={{
              display: 'grid',
              gap: 6,
              padding: 20,
              borderRadius: 22,
              border: `3px solid ${p.key === 'riding' ? C.ink : p.key === 'soon' ? C.ink : C.yes}`,
              background: p.bg,
              color: p.fg,
              transform: `scale(${pop})`,
            }}
          >
            <strong style={{ font: `30px/1.05 ${DISPLAY}`, textTransform: 'uppercase' }}>{p.title}</strong>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{fmt(m)} to Ayala</span>
            <span
              style={{
                justifySelf: 'start',
                marginTop: 8,
                padding: '9px 18px',
                borderRadius: 99,
                border: '2px solid currentColor',
                fontWeight: 700,
              }}
            >
              {p.btn}
            </span>
          </div>
        </div>
      )}
      <p style={{ ...muted, fontSize: 15, marginTop: 14 }}>Keep this screen open while riding. Your location stays on your phone.</p>
      <Tap f={f} at={6} x={195} y={190} />
    </div>
  )
}

// Scan: a photo of a Cavite jeep's signboard, the scan line sweeps, and the match lands.
export function ScanScreen({ f }) {
  const pct = Math.round(tw(f, 6, 52, 0, 100, (t) => t))
  const reading = f >= 6 && f < 60
  const sweep = ((f - 6) % 40) / 40
  const y = (sweep < 0.5 ? sweep * 2 : 2 - sweep * 2) * 197
  const up = tw(f, 60, 18, 0, 318, EIO)
  return (
    <div style={PAD}>
      <TopBar area="Cavite" />
      <div style={{ transform: `translateY(${-up}px)` }}>
        <h1 style={h1}>Where does that ride go?</h1>
        <p style={muted}>Take a photo of the signboard on a jeep, bus or UV. We'll tell you where it passes.</p>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 72,
            marginTop: 20,
            borderRadius: 22,
            background: C.red,
            color: '#fff',
            font: `700 18px/1 ${SANS}`,
            boxShadow: `0 6px 0 ${C.redDeep}`,
          }}
        >
          <span style={{ position: 'absolute', inset: 0, background: 'rgb(0 0 0 / .22)', transform: `scaleX(${reading ? pct / 100 : 0})`, transformOrigin: 'left' }} />
          <span style={{ position: 'relative', display: 'flex', gap: 10, alignItems: 'center' }}>
            {reading ? (
              `Reading the signboard… ${pct}%`
            ) : (
              <>
                <Icon d={CAMERA} size={26} /> Scan a signboard
              </>
            )}
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            height: 200,
            marginTop: 16,
            borderRadius: 14,
            overflow: 'hidden',
            border: `2px solid ${C.ink}`,
            background: 'linear-gradient(180deg, #7a1222 0%, #a3172d 38%, #d9d2c2 38%, #d9d2c2 44%, #2c2a26 44%, #3b3832 100%)',
          }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, top: 18, height: 6, background: 'repeating-linear-gradient(90deg, #f3b81f 0 18px, #2fa36b 18px 36px, #fff 36px 54px)' }} />
          <Plakard a="SM Bacoor" b="SM Molino" style={{ position: 'absolute', left: 34, right: 34, top: 44, transform: 'rotate(-2deg)', fontSize: 30 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: 'linear-gradient(transparent, rgb(0 0 0 / .45))' }} />
          {reading && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: C.yellow, boxShadow: `0 0 16px 4px ${C.yellow}`, transform: `translateY(${y}px)` }} />
          )}
        </div>
        <div style={{ font: `700 14px/1 ${SANS}`, margin: '22px 0 8px' }}>Or type what it says</div>
        <div
          style={{
            minHeight: 52,
            padding: '13px 16px',
            border: `2px solid ${f >= 60 ? C.ink : C.line}`,
            borderRadius: 14,
            background: C.surface,
            font: `600 17px/1.2 ${SANS}`,
            letterSpacing: '.04em',
            color: f >= 60 ? C.ink : C.muted,
          }}
        >
          {f >= 60 ? 'SM BACOOR - SM MOLINO' : 'e.g. SM Molino - SM Bacoor'}
        </div>
        <div style={{ ...h2, ...rise(f, 70) }}>Which one did you see?</div>
        {[
          ['SM Bacoor', 'SM Molino', 0.97, 74],
          ['SM Molino', 'Trece', 0.42, 78],
        ].map(([a, b, s, at]) => (
          <div key={a + b} style={{ marginBottom: 16, ...rise(f, at) }}>
            <Plakard small a={a} b={b} />
            <span style={{ display: 'block', height: 6, marginTop: 8, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', background: C.ink, transform: `scaleX(${tw(f, at + 4, 20, 0, s)})`, transformOrigin: 'left' }} />
            </span>
          </div>
        ))}
      </div>
      <TabBar on="scan" />
    </div>
  )
}
