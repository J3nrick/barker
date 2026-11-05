import { useEffect, useMemo, useState } from 'react'
import { CONFIDENT, match } from './matcher.js'
import { readPlakard } from './ocr.js'
import { canListen, listen, parseTrip, say } from './voice.js'
import { km, plan } from './trip.js'
import RouteMap from './RouteMap.jsx'
import data from './routes.json'
import './App.css'

const { routes, meta } = data
const places = [...new Set(routes.flatMap((r) => r.via.map((v) => v.name)))].sort()
const routesTo = (place) => routes.filter((r) => r.via.some((v) => v.name === place))

const KINDS = { jeep: 'Jeep', modern: 'Modern jeep', uv: 'UV Express', bus: 'Bus', p2p: 'P2P bus' }
const inArea = (v) => v.lat > 14.33 && v.lat < 14.47 && v.lng > 120.9 && v.lng < 121.0 // Imus + Bacoor
const placePos = Object.fromEntries(routes.flatMap((r) => r.via.map((v) => [v.name, v])))
const fmtKm = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`)
const walk = (d) => (d < 0.05 ? 'nandiyan ka na' : `${fmtKm(d)} lakad`)

// Every sakayan in Imus/Bacoor: OSM terminals and tricycle stands, plus terminals we only know from route stops.
const withKey = (h) => ({ ...h, key: `${h.name}@${h.lat},${h.lng}` })
const hubs = (() => {
  const list = data.sakayan.map((s) => ({ ...s, rides: s.t === 'terminal' ? routesTo(s.name) : [] }))
  for (const r of routes)
    for (const v of r.via)
      if (v.k === 't' && inArea(v) && !list.some((h) => h.name === v.name))
        list.push({ name: v.name, lat: v.lat, lng: v.lng, t: 'terminal', rides: routesTo(v.name) })
  return list.map(withKey).sort((a, b) => b.rides.length - a.rides.length || (a.t === 'trike') - (b.t === 'trike'))
})()

// Sakayan the user added on this phone. They also get a prefilled GitHub issue so a maintainer can put them on OSM for everyone.
const MINE = 'dadaan-ba:mine'
const loadMine = () => {
  try {
    return JSON.parse(localStorage.getItem(MINE)) ?? []
  } catch {
    return []
  }
}
const saveMine = (list) => {
  try {
    localStorage.setItem(MINE, JSON.stringify(list))
  } catch {
    // private mode: keep it for this visit only
  }
}
const ADD_KINDS = ['Tricycle / TODA', 'Jeep', 'Modern jeep', 'UV Express', 'Bus', 'Iba pa']
const issueUrl = (s) =>
  'https://github.com/J3nrick/dadaan-ba/issues/new?' +
  new URLSearchParams({
    template: 'new-sakayan.yml',
    title: `Sakayan: ${s.name}`,
    name: s.name,
    kind: s.kind,
    location: `${s.lat}, ${s.lng}`,
    rides: s.goes,
  })
const directions = (h) => `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}&travelmode=walking`

/** Without a starting point, suggest boarding at a terminal in Imus/Bacoor. */
function boardingPoint(route, goal) {
  const spots = route.via.filter((v) => v.k !== 'l' && v.name !== goal)
  return spots.find((v) => v.k === 't' && inArea(v)) ?? spots.find(inArea) ?? spots[0] ?? null
}

/** Rides to `goal`; with a start point (GPS or a named place) only nearby ones, plus one-transfer trips when none go direct. */
function tripFor(goal, start) {
  const any = routesTo(goal).map((r) => ({ r, at: boardingPoint(r, goal) }))
  if (!start) return { walk: false, direct: any, transfers: [], far: false }
  const t = plan(routes, start, goal, placePos[goal])
  return {
    ...t,
    far: !t.walk && !t.direct.length && !t.transfers.length,
    direct: t.direct.length || t.walk || t.transfers.length ? t.direct : any,
  }
}

function say1(goal, from, t) {
  const ride = (r) => `${KINDS[r.kind]} na ${r.plakard.replace(' - ', ' hanggang ')}`
  const pre = `Papuntang ${goal}${from ? ` galing ${from}` : ''}: `
  if (t.walk) return say(`${pre}malapit lang, puwedeng lakarin.`)
  const d = t.direct[0]
  if (d && !t.far) return say(`${pre}sumakay ng ${ride(d.r)}${d.at ? ` sa ${d.at.name}` : ''}.`)
  const x = t.transfers[0]
  if (x) return say(`${pre}sumakay ng ${ride(x.a)} sa ${x.at.name}, bumaba sa ${x.via.name}, tapos lumipat sa ${ride(x.b)}.`)
  say(d ? `${pre}may ${t.direct.length} na sasakyan, pero wala malapit sa iyo.` : `Wala pa akong alam na sasakyan papuntang ${goal}.`)
}

const Icon = ({ d, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
)
const CAMERA = 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
const CHECK = 'M5 12.5l4.5 4.5L19 7'
const CROSS = 'M6 6l12 12M18 6L6 18'
const MIC = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3'
const PIN = 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
const ARROW = 'M5 12h14M13 6l6 6-6 6'

function Plakard({ route, small }) {
  const [a, b] = route.plakard.split(' - ')
  return (
    <div className={`plakard${small ? ' small' : ''}`}>
      <span>{a}</span>
      {b && <span className="dash" aria-hidden="true" />}
      {b && <span>{b}</span>}
      {route.kind !== 'jeep' && (
        <em className={route.kind}>
          {KINDS[route.kind]}
          {route.ref && ` ${route.ref}`}
        </em>
      )}
    </div>
  )
}

/** Free-text or spoken question -> a known place. */
function AskBar({ label, placeholder, onPlace }) {
  const [q, setQ] = useState('')
  const [state, setState] = useState('idle') // idle | listening | miss | nomic
  const resolve = (text, spoken) => {
    const { from, to } = parseTrip(text, places)
    setState(to ? 'idle' : 'miss')
    if (to) onPlace(to, spoken, from)
  }
  async function talk() {
    setState('listening')
    try {
      const heard = await listen()
      setQ(heard)
      if (heard) resolve(heard, true)
      else setState('idle')
    } catch {
      setState('nomic')
    }
  }
  return (
    <form
      className="askform"
      onSubmit={(e) => {
        e.preventDefault()
        resolve(q, false)
      }}
    >
      <label className="field">
        <span>{label}</span>
        <div className="askbar">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            list="places"
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
          {canListen && (
            <button type="button" className="mic" onClick={talk} aria-pressed={state === 'listening'} aria-label="Itanong gamit ang boses">
              <Icon d={MIC} />
            </button>
          )}
          <button type="submit" className="go" aria-label="Hanapin">
            <Icon d={ARROW} />
          </button>
        </div>
      </label>
      <div aria-live="polite">
        {state === 'listening' && <p className="note listening">Nakikinig… sabihin kung saan ka pupunta.</p>}
        {state === 'miss' && <p className="note error">Hindi ko kilala ang lugar na iyan. Subukan ang ibang tawag o pumili sa listahan.</p>}
        {state === 'nomic' && <p className="note error">Hindi magamit ang mikropono. I-type na lang ang tanong.</p>}
      </div>
    </form>
  )
}

function SakayanView({ here, locateButton, locating, onRide }) {
  const [show, setShow] = useState('all') // all | terminal | trike
  const [open, setOpen] = useState('')
  const [all, setAll] = useState(false)
  const [mine, setMine] = useState(loadMine)
  const [draft, setDraft] = useState(null) // { name, kind, goes, lat, lng } while adding

  const list = useMemo(() => {
    const own = mine.map((m) => withKey({ ...m, rides: [], mine: true }))
    const shown = [...own, ...hubs].filter((h) => show === 'all' || h.t === show)
    return here ? shown.sort((a, b) => km(here, a) - km(here, b)) : shown
  }, [show, here, mine])
  const visible = all ? list : list.slice(0, 20)

  function save(e) {
    e.preventDefault()
    const s = {
      ...draft,
      name: draft.name.trim(),
      lat: +draft.lat.toFixed(5),
      lng: +draft.lng.toFixed(5),
      t: draft.kind === ADD_KINDS[0] ? 'trike' : 'terminal',
    }
    const next = [s, ...mine]
    setMine(next)
    saveMine(next)
    setDraft(null)
    setShow('all')
    setOpen(withKey(s).key)
  }
  function remove(key) {
    const next = mine.filter((m) => withKey(m).key !== key)
    setMine(next)
    saveMine(next)
  }

  return (
    <>
      <h1>Mga sakayan</h1>
      <p>
        Mga terminal ng jeep, UV at bus, at mga paradahan ng tricycle sa Imus at Bacoor. Gamitin ang lokasyon mo para makita ang
        pinakamalapit.
      </p>
      {locateButton}
      {locating === 'denied' && <p className="note error">Hindi makuha ang lokasyon mo.</p>}
      <div className="chips filter" role="group" aria-label="Uri ng sakayan">
        {[
          ['all', 'Lahat'],
          ['terminal', 'Jeep · UV · Bus'],
          ['trike', 'Tricycle'],
        ].map(([k, label]) => (
          <button key={k} aria-pressed={show === k} onClick={() => setShow(k)}>
            {label}
          </button>
        ))}
      </div>
      <RouteMap
        points={list}
        here={here}
        active={open}
        onPoint={setOpen}
        pin={draft?.lat ? draft : null}
        onTap={(pos) => draft && setDraft({ ...draft, ...pos })}
      />

      <h2>
        {here ? 'Pinakamalapit sa iyo' : 'Lahat ng sakayan'} <span>{list.length}</span>
      </h2>
      <ul className="hubs">
        {visible.map((h) => (
          <li key={h.key}>
            <button className="hub" aria-expanded={open === h.key} onClick={() => setOpen(open === h.key ? '' : h.key)}>
              <span>
                <b>{h.name}</b>
                <small>
                  {h.mine ? `Idinagdag mo · ${h.kind}` : h.t === 'trike' ? 'Tricycle' : 'Terminal'}
                  {here && ` · ${fmtKm(km(here, h))} mula sa iyo`}
                </small>
              </span>
              {h.rides.length > 0 && <span className="count">{h.rides.length} sasakyan</span>}
            </button>
            {open === h.key && (
              <div className="hubinfo">
                {h.t === 'trike' && !h.mine && (
                  <p className="note">
                    Para sa maikling biyahe papasok sa subdivision o barangay. Itanong sa dispatcher ang ruta at pamasahe.
                  </p>
                )}
                {h.mine && h.goes && <p className="note">Papunta: {h.goes}</p>}
                {h.rides.length > 0 && (
                  <ul className="rides">
                    {h.rides.map((r) => (
                      <li key={r.id}>
                        <button onClick={() => onRide(r)}>
                          <Plakard route={r} small />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="actions">
                  <a href={directions(h)} target="_blank" rel="noreferrer">
                    Direksyon papunta rito →
                  </a>
                  {h.mine && (
                    <>
                      <a href={issueUrl(h)} target="_blank" rel="noreferrer">
                        Ipadala sa GitHub para makita ng lahat →
                      </a>
                      <button onClick={() => remove(h.key)}>Burahin</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {list.length > visible.length && (
        <button className="locate more" onClick={() => setAll(true)}>
          Ipakita lahat ({list.length})
        </button>
      )}

      <h2>May kulang na sakayan?</h2>
      {!draft ? (
        <button className="locate" onClick={() => setDraft({ name: '', kind: ADD_KINDS[0], goes: '', ...(here ?? {}) })}>
          + Magdagdag ng sakayan
        </button>
      ) : (
        <form className="addform" onSubmit={save}>
          <label className="field">
            <span>Pangalan</span>
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="hal. Tricycle sa harap ng Puregold"
            />
          </label>
          <label className="field">
            <span>Anong sasakyan</span>
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
              {ADD_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Papunta saan? (hindi required)</span>
            <input
              value={draft.goes}
              onChange={(e) => setDraft({ ...draft, goes: e.target.value })}
              placeholder="hal. Imus Bayan, Bucandala"
            />
          </label>
          <p className="note">
            {draft.lat
              ? `Lokasyon: ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}. Tapikin ang mapa para baguhin.`
              : 'Tapikin ang mapa sa itaas kung saan ang sakayan, o gamitin ang lokasyon mo.'}
          </p>
          <div className="actions">
            <button type="submit" className="save" disabled={!draft.lat || !draft.name.trim()}>
              I-save
            </button>
            {here && (
              <button type="button" onClick={() => setDraft({ ...draft, ...here })}>
                Dito mismo ako
              </button>
            )}
            <button type="button" onClick={() => setDraft(null)}>
              Kanselahin
            </button>
          </div>
          <p className="note">
            Sa phone mo lang muna ito makikita. Pagkatapos i-save, puwede mo itong ipadala sa GitHub para maidagdag para sa lahat.
          </p>
        </form>
      )}
    </>
  )
}

export default function App() {
  const [status, setStatus] = useState('idle') // idle | reading | done | error
  const [progress, setProgress] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [text, setText] = useState('')
  const [picked, setPicked] = useState(() => routes.find((r) => location.hash === `#ruta=${r.id}`) ?? null)
  const [copied, setCopied] = useState(false)
  const [dest, setDest] = useState('')
  const [mode, setMode] = useState('ask') // ask | scan | hubs
  const [goal, setGoal] = useState('')
  const [origin, setOrigin] = useState('') // a named starting place, from "galing X papuntang Y"
  const [here, setHere] = useState(null)
  const [locating, setLocating] = useState('') // '' | busy | denied

  const results = useMemo(() => (text.trim() ? match(text, routes) : []), [text])
  // Confident only when the best match also clearly beats the runner-up.
  const sure = results[0]?.score >= CONFIDENT && results[0].score - (results[1]?.score ?? 0) >= 0.1
  const route = picked ?? (sure ? results[0].route : null)
  const passes = route && dest ? route.via.some((v) => v.name === dest) : null

  const start = origin ? placePos[origin] : here
  const trip = useMemo(() => tripFor(goal, start), [goal, start])

  useEffect(() => () => photo && URL.revokeObjectURL(photo), [photo])

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhoto(URL.createObjectURL(file))
    setStatus('reading')
    setProgress(0)
    setPicked(null)
    try {
      setText((await readPlakard(file, setProgress)).trim())
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  function locate() {
    if (!('geolocation' in navigator)) return setLocating('denied')
    setLocating('busy')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHere({ lat: p.coords.latitude, lng: p.coords.longitude })
        setLocating('')
      },
      () => setLocating('denied'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  function askGoal(place, spoken, from = '') {
    setGoal(place)
    setOrigin(from ?? '')
    if (spoken) say1(place, from, tripFor(place, from ? placePos[from] : here))
  }

  function askDest(place, spoken) {
    setDest(place)
    if (spoken) say(route.via.some((v) => v.name === place) ? `Oo, dadaan ito sa ${place}.` : `Hindi dadaan sa ${place}.`)
  }

  function choose(r, to = dest) {
    setPicked(r)
    setDest(to)
    setText(r.plakard)
    window.scrollTo({ top: 0 })
  }

  function reset() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search)
    setPicked(null)
    setText('')
    setDest('')
    setPhoto(null)
    setStatus('idle')
  }

  // The phone's back button closes a route instead of leaving the app; each open route is a history entry.
  useEffect(() => {
    if (!route || history.state?.r === route.id) return
    // Opened from a shared link: put the home screen underneath, so Back lands there instead of on the link again.
    if (!history.state && location.hash === `#ruta=${route.id}`) history.replaceState(null, '', location.pathname + location.search)
    history.pushState({ r: route.id }, '', `#ruta=${route.id}`)
  }, [route])
  useEffect(() => {
    // Back/forward, or a pasted #ruta= link in an open tab.
    const onPop = () => {
      const linked = routes.find((r) => location.hash === `#ruta=${r.id}`)
      if (linked) setPicked(linked)
      else reset()
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  const goBack = () => (history.state?.r ? history.back() : reset())

  async function share() {
    const url = `${location.origin}${location.pathname}#ruta=${route.id}`
    try {
      if (navigator.share) await navigator.share({ title: `${route.plakard} · Dadaan Ba?`, text: `Saan dadaan ang ${route.plakard}`, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // share sheet dismissed
    }
  }

  const locateButton = (
    <button className="locate" onClick={locate} disabled={locating === 'busy'}>
      <Icon d={PIN} size={18} />
      {locating === 'busy' ? 'Hinahanap ka…' : here ? 'Na-update ang lokasyon mo' : 'Gamitin ang lokasyon ko'}
    </button>
  )

  return (
    <div className="app">
      <datalist id="places">
        {places.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <header className="top">
        <button className="brand" onClick={() => goBack() || setGoal('') || setOrigin('')} aria-label="Dadaan Ba? Bumalik sa simula">
          Dadaan<span>Ba?</span>
        </button>
        <span className="area">Imus · Bacoor</span>
      </header>

      <main>
        {!route && (
          <section className="hero">
            <div className="tabs" role="tablist" aria-label="Paraan ng paghahanap">
              <button role="tab" aria-selected={mode === 'ask'} onClick={() => setMode('ask')}>
                Itanong
              </button>
              <button role="tab" aria-selected={mode === 'scan'} onClick={() => setMode('scan')}>
                I-scan
              </button>
              <button role="tab" aria-selected={mode === 'hubs'} onClick={() => setMode('hubs')}>
                Mga sakayan
              </button>
            </div>

            {mode === 'ask' && (
              <>
                <h1>Saan ka pupunta?</h1>
                <p>Itanong gamit ang boses o i-type. Sasabihin namin kung anong jeep, bus o UV ang sasakyan, at kung saan ang sakayan.</p>
                <AskBar label="Itanong" placeholder="hal. sakayan papuntang PITX" onPlace={askGoal} />

                {!goal && (
                  <div className="chips" aria-label="Mga halimbawa">
                    {['SM Molino', 'PITX', 'Imus Transport Plaza', 'The District Imus', 'Alabang', 'Makati']
                      .filter((p) => places.includes(p))
                      .map((p) => (
                        <button key={p} onClick={() => askGoal(p, false)}>
                          {p}
                        </button>
                      ))}
                  </div>
                )}

                {goal && (
                  <div className="picks" aria-live="polite">
                    <h2>
                      Papuntang {goal} <span>{trip.direct.length || trip.transfers.length}</span>
                    </h2>
                    {origin ? (
                      <p className="from">
                        Galing sa <b>{origin}</b>
                        <button onClick={() => setOrigin('')} aria-label="Alisin ang pinanggalingan">
                          ×
                        </button>
                      </p>
                    ) : (
                      locateButton
                    )}
                    {locating === 'denied' && !origin && (
                      <p className="note error">Hindi makuha ang lokasyon mo. Ang ipinapakita ay ang mga terminal.</p>
                    )}
                    {trip.walk && <p className="note">Malapit lang ito, mga {fmtKm(km(start, placePos[goal]))}. Puwedeng lakarin.</p>}
                    {trip.far && (
                      <p className="note">
                        Walang dumadaan malapit sa {origin || 'iyo'} papunta diyan. Ito ang lahat ng sasakyang papuntang {goal}:
                      </p>
                    )}
                    {!trip.direct.length && !trip.transfers.length && !trip.walk && (
                      <p className="note">Wala pa kaming alam na sasakyan papunta diyan. Tumulong magdagdag ng ruta sa GitHub.</p>
                    )}
                    <ul>
                      {trip.direct.map(({ r, at }) => (
                        <li key={r.id}>
                          <button onClick={() => choose(r, goal)}>
                            <Plakard route={r} small />
                            <span className="hint">
                              {at ? (
                                <>
                                  Sakayan: <b>{at.name}</b>
                                  {at.d !== undefined && ` · ${walk(at.d)}`}
                                </>
                              ) : (
                                'Pumara kahit saan sa ruta'
                              )}{' '}
                              · tingnan ang ruta →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {trip.transfers.length > 0 && (
                      <>
                        <h2>May isang lipat</h2>
                        <ol className="transfers">
                          {trip.transfers.map(({ a, at, via, b }) => (
                            <li key={a.id + b.id}>
                              <button onClick={() => choose(a, via.name)}>
                                <Plakard route={a} small />
                                <span className="hint">
                                  Sakay sa <b>{at.name}</b> · {walk(at.d)} · bumaba sa <b>{via.name}</b>
                                </span>
                              </button>
                              <button onClick={() => choose(b, goal)}>
                                <Plakard route={b} small />
                                <span className="hint">
                                  Lumipat dito sa <b>{via.name}</b> papuntang {goal}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {mode === 'hubs' && <SakayanView here={here} locateButton={locateButton} locating={locating} onRide={(r) => choose(r, '')} />}

            {mode === 'scan' && (
              <>
                <h1>Saan ba dadaan ang sasakyang 'yan?</h1>
                <p>Kunan ng litrato ang plakard ng jeep, bus o UV. Sasabihin namin kung saan ito dadaan.</p>

                <label className={`scan${status === 'reading' ? ' busy' : ''}`}>
                  <input type="file" accept="image/*" capture="environment" onChange={onPhoto} disabled={status === 'reading'} />
                  {status === 'reading' ? (
                    <>
                      <span className="bar" style={{ '--p': progress }} aria-hidden="true" />
                      <span>Binabasa ang plakard… {Math.round(progress * 100)}%</span>
                    </>
                  ) : (
                    <>
                      <Icon d={CAMERA} size={26} />
                      <span>I-scan ang plakard</span>
                    </>
                  )}
                </label>

                {photo && (
                  <figure className={`shot${status === 'reading' ? ' reading' : ''}`}>
                    <img src={photo} alt="Litrato ng plakard na ini-scan" />
                  </figure>
                )}

                <label className="field">
                  <span>O i-type ang nakasulat</span>
                  <input
                    className="plate"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value)
                      setPicked(null)
                    }}
                    placeholder="hal. SM Molino - SM Bacoor"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </label>

                <div aria-live="polite">
                  {status === 'error' && (
                    <p className="note error">Hindi nabasa ang litrato. Lumapit, iwasan ang silaw, o i-type na lang.</p>
                  )}
                  {status === 'done' && !text && (
                    <p className="note error">Walang nabasang letra. Subukan ulit nang mas malapit, o i-type na lang.</p>
                  )}
                </div>

                {results.length > 0 && (
                  <div className="picks">
                    <h2>Alin dito ang nakita mo?</h2>
                    <ul>
                      {results.map(({ route: r, score }) => (
                        <li key={r.id}>
                          <button onClick={() => choose(r)} aria-label={`${r.plakard}, ${Math.round(score * 100)}% tugma`}>
                            <Plakard route={r} small />
                            <span className="meter" style={{ '--s': score }} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!text &&
                  Object.entries(KINDS).map(([kind, name]) => {
                    const list = routes.filter((r) => r.kind === kind)
                    return (
                      list.length > 0 && (
                        <div className="catalog" key={kind}>
                          <h2>
                            {name} <span>{list.length}</span>
                          </h2>
                          <ul>
                            {list.map((r) => (
                              <li key={r.id}>
                                <button onClick={() => choose(r)}>
                                  <Plakard route={r} small />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )
                  })}
              </>
            )}
          </section>
        )}

        {route && (
          <section className="result">
            <div className="bar">
              <button className="back" onClick={goBack}>
                ← Bumalik
              </button>
              <button className="share" onClick={share}>
                {copied ? 'Nakopya ang link' : 'I-share'}
              </button>
            </div>
            <Plakard route={route} />
            {(route.operator || route.roads.length > 0) && (
              <p className="op">
                {route.roads.length > 0 && <>Via {route.roads.join(' · ')}</>}
                {route.operator && <span>{route.operator}</span>}
              </p>
            )}

            <div className="ask">
              <AskBar key={route.id} label="Dadaan ba sa…?" placeholder="hal. Dadaan ba sa Imus Cathedral?" onPlace={askDest} />
            </div>

            <div aria-live="polite">
              {passes !== null && (
                <p className={`answer ${passes ? 'yes' : 'no'}`} key={dest}>
                  <Icon d={passes ? CHECK : CROSS} size={28} />
                  <span>
                    <strong>{passes ? 'Oo, sakay na!' : 'Hindi dadaan.'}</strong>
                    {passes
                      ? `Dadaan ito malapit sa ${dest}.`
                      : `Hindi dumadaan ang rutang ito malapit sa ${dest}. Itanong kung anong sasakyan papunta doon.`}
                  </span>
                </p>
              )}
              {passes === false && (
                <button
                  className="locate"
                  onClick={() => {
                    setGoal(dest)
                    setOrigin('')
                    setMode('ask')
                    goBack()
                  }}
                >
                  Ano ang sasakyan papuntang {dest}? →
                </button>
              )}
            </div>

            <RouteMap route={route} dest={dest} here={here} />

            <h2 className="vialabel">Mga madadaanan</h2>
            {route.via.length > 0 ? (
              <ol className="line">
                {route.via.map((v) => (
                  <li key={v.name} className={v.name === dest ? 'hit' : ''}>
                    <button onClick={() => setDest(v.name)} aria-pressed={v.name === dest}>
                      {v.name}
                      {v.k === 't' && <span className="tag">Terminal</span>}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="note">Wala pa kaming naitalang landmark sa rutang ito. Tingnan ang mapa.</p>
            )}
            <p className="source">
              Ruta mula sa{' '}
              <a href={`https://www.openstreetmap.org/relation/${route.osm}`} target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>
              . Hindi pa nakumpirma sa kalsada. Puwedeng magbago ang ruta.
              {route.kind === 'p2p' && ' Ang P2P ay humihinto lang sa mga nakalistang stop.'}
            </p>
          </section>
        )}
      </main>

      <footer>Datos: © OpenStreetMap contributors (ODbL), kinuha noong {meta.fetched}.</footer>
    </div>
  )
}
