// Trip planning over the route list: direct rides, else one transfer at a shared place.
import { score } from './matcher.js'

/** Distance in km between two {lat, lng}; flat-earth is plenty at city scale. */
export const km = (a, b) => {
  const dlat = ((b.lat - a.lat) * Math.PI) / 180
  const dlng = (((b.lng - a.lng) * Math.PI) / 180) * Math.cos((a.lat * Math.PI) / 180)
  return 6371 * Math.hypot(dlat, dlng)
}

const passes = (r, place) => r.via.some((v) => v.name === place)
const nearest = (r, p) => r.via.reduce((best, v) => (km(p, v) < (best?.d ?? Infinity) ? { ...v, d: km(p, v) } : best), null)

const WALK = 1.2 // km people will walk to a stop; beyond that it's not "malapit"
const DETOUR = 1.6 // max (start→change→goal) / (start→goal), as the crow flies

/**
 * From a point (GPS or a named place) to a place.
 * walk: the goal is a short walk away. direct: [{ r, at }]. transfers: [{ a, at, via, b }] only when nothing goes direct.
 */
export function plan(routes, from, goal, goalPos) {
  if (goalPos && km(from, goalPos) < 0.4) return { walk: true, direct: [], transfers: [] }
  const toGoal = routes.filter((r) => passes(r, goal))
  const direct = toGoal
    .map((r) => ({ r, at: nearest(r, from) }))
    .filter(({ at }) => at && at.d <= WALK && at.name !== goal)
    .sort((x, y) => x.at.d - y.at.d)
  if (direct.length) return { walk: false, direct, transfers: [] }

  const transfers = []
  for (const a of routes) {
    if (toGoal.includes(a)) continue
    const at = nearest(a, from)
    if (!at || at.d > WALK) continue
    for (const b of toGoal) {
      // Change where both pass; prefer the change point that keeps the trip most direct.
      const shared = a.via.filter((v) => v.name !== goal && v.name !== at.name && passes(b, v.name))
      if (!shared.length) continue
      const cost = (v) => km(from, v) + (goalPos ? km(v, goalPos) : 0)
      const via = shared.reduce((x, y) => (cost(x) <= cost(y) ? x : y))
      // Riding out to PITX just to come back is not a trip anyone would take.
      if (goalPos && cost(via) > DETOUR * km(from, goalPos) + 1) continue
      transfers.push({ a, at, via, b })
    }
  }
  transfers.sort((x, y) => x.at.d - y.at.d)
  // One suggestion per second ride; five ways onto the same UV is noise.
  const seen = new Set()
  const best = transfers.filter((x) => !seen.has(x.b.id) && seen.add(x.b.id))
  return { walk: false, direct, transfers: best.slice(0, 5) }
}

/**
 * Which signboard end you ride toward when going from stop `from` to stop `to` on `route`, e.g. "SM MOLINO".
 * Stops are ordered along the OSM route; we match its first and last stop to the two signboard ends to name the
 * direction the way the jeep itself does. null when we can't tell (loops, ends that match neither side).
 */
export function heading(route, from, to) {
  const i = route.via.findIndex((v) => v.name === from)
  const j = route.via.findIndex((v) => v.name === to)
  const [a, b] = route.plakard.split(' - ')
  if (route.loop || i < 0 || j < 0 || i === j || !b) return null
  const first = route.via[0].name
  const last = route.via.at(-1).name
  const same = score(a, first) + score(b, last) // signboard reads in the route's order
  const flipped = score(a, last) + score(b, first)
  if (Math.abs(same - flipped) < 0.25) return null // neither reading clearly fits
  const forward = same >= flipped ? b : a
  return j > i ? forward : forward === a ? b : a
}
