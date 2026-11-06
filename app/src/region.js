// Regions Barker covers. Each one's data lives in public/data/<id>.json and loads only when picked.
import { km } from './trip.js'

export const REGIONS = [
  {
    id: 'manila',
    name: 'Metro Manila',
    blurb: 'LRT, MRT, jeeps, buses, UV and P2P',
    bbox: [14.4, 120.93, 14.78, 121.13],
    examples: ['PITX', 'Cubao', 'Ayala', 'Quiapo', 'Baclaran', 'Alabang'],
  },
  {
    id: 'cavite',
    name: 'Cavite',
    blurb: 'Imus and Bacoor: jeeps, buses, UV, P2P and tricycles',
    bbox: [14.33, 120.9, 14.47, 121.0],
    examples: ['SM Molino', 'PITX', 'Imus Transport Plaza', 'The District Imus', 'Alabang', 'Makati'],
  },
]
export const regionById = (id) => REGIONS.find((r) => r.id === id)
/** The region whose box holds a GPS point, or null. */
export const regionAt = (p) => REGIONS.find(({ bbox: [s, w, n, e] }) => p.lat >= s && p.lat <= n && p.lng >= w && p.lng <= e) ?? null

/**
 * Raw region file -> what the app works with. Stops are stored once and referenced by index, so this turns
 * each route's [[place, km], ...] back into stop objects and precomputes the lookups every screen needs.
 */
export function expand(raw, region) {
  const meta = { ...raw.meta, ...region }
  const stop = ([name, lat, lng, k]) => ({ name, lat, lng, k })
  const routes = raw.routes.map((r) => ({
    ...r,
    via: r.v.map(([i, at]) => ({ ...stop(raw.places[i]), km: at })),
    pathUrl: `./paths/${meta.id}/${r.id}.json?v=${meta.v}`,
  }))
  const byPlace = new Map()
  for (const r of routes) for (const v of r.via) byPlace.set(v.name, [...(byPlace.get(v.name) ?? []), r])
  const routesTo = (place) => byPlace.get(place) ?? []
  const placePos = Object.fromEntries(routes.flatMap((r) => r.via.map((v) => [v.name, v])))
  const places = [...byPlace.keys()].sort()
  const [s, w, n, e] = meta.bbox
  const inArea = (v) => v.lat > s && v.lat < n && v.lng > w && v.lng < e
  // Well-known places first, then the terminals and stations served by the most routes.
  const busiest = [...byPlace].filter(([name]) => placePos[name].k === 't').sort((a, b) => b[1].length - a[1].length)
  const examples = [...new Set([...(region.examples ?? []).filter((p) => byPlace.has(p)), ...busiest.map(([name]) => name)])].slice(0, 6)
  // Only places more than one ride serves, or landmarks, go in the typing suggestions: thousands of options lag on phones.
  const suggest = places.filter((p) => routesTo(p).length > 1 || placePos[p].k !== 's')

  // Every ride spot in the area: OSM terminals, stations and tricycle stands, plus terminals known only from route stops.
  const hubs = raw.sakayan.map((h) => ({ ...h, rides: h.t === 'trike' ? [] : routesTo(h.name) }))
  const listed = new Set(hubs.map((h) => h.name))
  for (const r of routes)
    for (const v of r.via)
      if (v.k === 't' && inArea(v) && !listed.has(v.name)) {
        listed.add(v.name)
        hubs.push({ ...v, t: 'terminal', rides: routesTo(v.name) })
      }
  for (const h of hubs) h.key = `${h.name}@${h.lat},${h.lng}`
  hubs.sort((a, b) => b.rides.length - a.rides.length || (a.t === 'trike') - (b.t === 'trike'))

  return { meta, routes, places, placePos, routesTo, inArea, examples, suggest, hubs, km }
}

export async function loadRegion(id) {
  const region = regionById(id)
  const res = await fetch(`./data/${id}.json`)
  if (!res.ok) throw new Error(`region ${id}: ${res.status}`)
  return expand(await res.json(), region)
}
