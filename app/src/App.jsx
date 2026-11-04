import { useEffect, useMemo, useState } from 'react'
import { CONFIDENT, match } from './matcher.js'
import { readPlakard } from './ocr.js'
import RouteMap from './RouteMap.jsx'
import data from './routes.json'
import './App.css'

const { routes, meta } = data
const landmarks = [...new Set(routes.flatMap((r) => r.via.map((v) => v.name)))].sort()
const routesTo = (place) => routes.filter((r) => r.via.some((v) => v.name === place))

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

function Plakard({ route, small }) {
  const [a, b] = route.plakard.split(' - ')
  return (
    <div className={`plakard${small ? ' small' : ''}`}>
      <span>{a}</span>
      {b && <span className="dash" aria-hidden="true" />}
      {b && <span>{b}</span>}
      {route.kind === 'modern' && <em>Modern</em>}
    </div>
  )
}

export default function App() {
  const [status, setStatus] = useState('idle') // idle | reading | done | error
  const [progress, setProgress] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [text, setText] = useState('')
  const [picked, setPicked] = useState(null)
  const [dest, setDest] = useState('')
  const [mode, setMode] = useState('scan') // scan | find
  const [goal, setGoal] = useState('')

  const results = useMemo(() => (text.trim() ? match(text, routes) : []), [text])
  // Confident only when the best match also clearly beats the runner-up.
  const sure = results[0]?.score >= CONFIDENT && results[0].score - (results[1]?.score ?? 0) >= 0.1
  const route = picked ?? (sure ? results[0].route : null)
  const passes = route && dest ? route.via.some((v) => v.name === dest) : null

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

  function choose(r, to = dest) {
    setPicked(r)
    setDest(to)
    setText(r.plakard)
    window.scrollTo({ top: 0 })
  }

  function reset() {
    setPicked(null)
    setText('')
    setDest('')
    setGoal('')
    setPhoto(null)
    setStatus('idle')
  }

  return (
    <div className="app">
      <header className="top">
        <button className="brand" onClick={reset} aria-label="Dadaan Ba? Bumalik sa simula">
          Dadaan<span>Ba?</span>
        </button>
        <span className="area">Imus · Bacoor</span>
      </header>

      <main>
        {!route && (
          <section className="hero">
            <div className="tabs" role="tablist" aria-label="Paraan ng paghahanap">
              <button role="tab" aria-selected={mode === 'scan'} onClick={() => setMode('scan')}>
                May jeep sa harap ko
              </button>
              <button role="tab" aria-selected={mode === 'find'} onClick={() => setMode('find')}>
                Saan ako sasakay?
              </button>
            </div>

            {mode === 'find' ? (
              <>
                <h1>Anong jeep papunta diyan?</h1>
                <p>Piliin kung saan ka pupunta. Sasabihin namin kung anong plakard ang hahanapin.</p>
                <label className="field">
                  <span>Pupunta ako sa…</span>
                  <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                    <option value="">Pumili ng lugar</option>
                    {landmarks.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                {goal && (
                  <div className="picks" aria-live="polite">
                    <h2>
                      Hanapin ang plakard na ito <span>{routesTo(goal).length}</span>
                    </h2>
                    <ul>
                      {routesTo(goal).map((r) => (
                        <li key={r.id}>
                          <button onClick={() => choose(r, goal)}>
                            <Plakard route={r} small />
                            <span className="hint">Dadaan malapit sa {goal} · tingnan ang ruta →</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1>Saan ba dadaan ang jeep na 'yan?</h1>
                <p>Kunan ng litrato ang plakard. Sasabihin namin kung saan ito dadaan.</p>

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

                {!text && (
                  <div className="catalog">
                    <h2>
                      Mga rutang alam namin <span>{routes.length}</span>
                    </h2>
                    <ul>
                      {routes.map((r) => (
                        <li key={r.id}>
                          <button onClick={() => choose(r)}>
                            <Plakard route={r} small />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {route && (
          <section className="result">
            <button className="back" onClick={reset}>
              ← Bumalik
            </button>
            <Plakard route={route} />
            {(route.operator || route.roads.length > 0) && (
              <p className="op">
                {route.roads.length > 0 && <>Via {route.roads.join(' · ')}</>}
                {route.operator && <span>{route.operator}</span>}
              </p>
            )}

            <label className="field ask">
              <span>Pupunta ka sa…</span>
              <select value={dest} onChange={(e) => setDest(e.target.value)}>
                <option value="">Pumili ng lugar</option>
                {landmarks.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>

            <div aria-live="polite">
              {passes !== null && (
                <p className={`answer ${passes ? 'yes' : 'no'}`} key={dest}>
                  <Icon d={passes ? CHECK : CROSS} size={28} />
                  <span>
                    <strong>{passes ? 'Oo, sakay na!' : 'Hindi dadaan.'}</strong>
                    {passes
                      ? `Dadaan ito malapit sa ${dest}.`
                      : `Hindi dumadaan ang rutang ito malapit sa ${dest}. Maghanap ng ibang jeep.`}
                  </span>
                </p>
              )}
            </div>

            <RouteMap route={route} dest={dest} />

            <h2 className="vialabel">Mga madadaanan</h2>
            {route.via.length > 0 ? (
              <ol className="line">
                {route.via.map((v) => (
                  <li key={v.name} className={v.name === dest ? 'hit' : ''}>
                    <button onClick={() => setDest(v.name)} aria-pressed={v.name === dest}>
                      {v.name}
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
            </p>
          </section>
        )}
      </main>

      <footer>Datos: © OpenStreetMap contributors (ODbL), kinuha noong {meta.fetched}.</footer>
    </div>
  )
}
