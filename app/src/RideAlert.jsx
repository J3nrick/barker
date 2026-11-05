import { useEffect, useRef, useState } from 'react'
import { rideStep } from './ride.js'
import { say } from './voice.js'

const fmt = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`)
const BELL = 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0'

const TITLE = {
  riding: (s) => `Riding to ${s}`,
  soon: () => 'Get ready to get off',
  here: () => "You're here. Para po!",
  passed: (s) => `You may have passed ${s}`,
}
// Said out loud and buzzed once when the phase changes; the screen may be in a pocket.
const ALERT = {
  soon: [(s) => `Get ready. ${s} is coming up.`, [300, 150, 300]],
  here: [(s) => `You're at ${s}. Para po!`, [600, 200, 600, 200, 600]],
  passed: [(s) => `You may have passed ${s}. Get off at the next stop.`, [1000]],
}

/** "Alert me before <stop>": follows GPS while you ride and warns you ~500 m before your stop. */
export default function RideAlert({ stop, onFix }) {
  const [ride, setRide] = useState(null) // null when not tracking
  const [error, setError] = useState('')
  const watch = useRef(null)
  const lock = useRef(null)
  const fixed = useRef(onFix)
  useEffect(() => {
    fixed.current = onFix
  })

  const tracking = ride !== null
  const phase = ride?.phase
  useEffect(() => {
    const alert = ALERT[phase]
    if (!alert) return
    say(alert[0](stop.name))
    navigator.vibrate?.(alert[1])
  }, [phase, stop.name])

  // Phones stop GPS updates when the screen sleeps, so keep it on while tracking (where supported).
  useEffect(() => {
    if (!tracking) return
    const keep = async () => {
      try {
        if (document.visibilityState === 'visible') lock.current = await navigator.wakeLock?.request('screen')
      } catch {
        // battery saver or unsupported: the alert still works while the screen is on
      }
    }
    keep()
    document.addEventListener('visibilitychange', keep)
    return () => {
      document.removeEventListener('visibilitychange', keep)
      lock.current?.release().catch(() => {})
      lock.current = null
    }
  }, [tracking])

  useEffect(() => () => watch.current !== null && navigator.geolocation.clearWatch(watch.current), [])

  function start() {
    if (!('geolocation' in navigator)) return setError("This phone can't share its location.")
    setError('')
    setRide({ phase: 'riding', d: null, min: Infinity, weak: true })
    say(`Okay. I'll tell you before ${stop.name}.`)
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const fix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy / 1000 }
        fixed.current?.(fix)
        setRide((r) => r && rideStep(r, fix, stop))
      },
      (e) => setError(e.code === 1 ? 'Location permission was denied. Allow it to get the alert.' : "Can't get your location right now."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    )
  }

  function end() {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
    watch.current = null
    setRide(null)
  }

  if (!tracking)
    return (
      <div className="ridebox">
        <button className="scan alertbtn" onClick={start}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={BELL} />
          </svg>
          <span>Alert me before {stop.name}</span>
        </button>
        <p className="note">Keep this screen open while riding. Your location stays on your phone.</p>
        {error && <p className="note error">{error}</p>}
      </div>
    )

  return (
    <div className={`ride ${phase}`} role="status" aria-live="assertive">
      <strong>{TITLE[phase](stop.name)}</strong>
      <span className="dist">{ride.d === null ? 'Finding you…' : `${fmt(ride.d)} to ${stop.name}`}</span>
      {ride.weak && ride.d !== null && <small>Weak GPS signal, waiting for a better fix…</small>}
      {error && <small>{error}</small>}
      <button onClick={end}>{phase === 'here' || phase === 'passed' ? 'Done' : 'Stop alert'}</button>
    </div>
  )
}
