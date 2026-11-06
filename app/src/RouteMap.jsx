import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Each route's line is its own small file (public/paths/<region>/<id>.json), fetched when its map opens.
const lines = new Map()
const loadLine = (url) => {
  if (!lines.has(url))
    lines.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .catch((e) => {
          lines.delete(url) // offline: try again next time
          throw e
        }),
    )
  return lines.get(url)
}

// shortcut: tiles load from tile.openstreetmap.org, so the map needs internet; offline maps need self-hosted tiles (OSM forbids bulk prefetching).
/**
 * One route with its stops, or (with `points`) a set of sakayan to pick from.
 * `onTap` gets {lat, lng} for map taps (to drop a pin when adding a sakayan); `pin` draws that pin.
 */
export default function RouteMap({ route, dest, here, points, active, onPoint, onTap, pin }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const cb = useRef({})
  const [line, setLine] = useState(null) // { url, path }
  useEffect(() => {
    if (route)
      loadLine(route.pathUrl).then(
        (path) => setLine({ url: route.pathUrl, path }),
        () => {},
      )
  }, [route])
  const path = route && line?.url === route.pathUrl ? line.path : null
  useEffect(() => {
    cb.current = { onPoint, onTap }
  })

  // One map for the component's life, so tapping or selecting doesn't reset the view.
  useEffect(() => {
    // Canvas draws a city's worth of ride spots (1000+ dots) much faster than SVG on a phone.
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, preferCanvas: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    m.on('click', (e) => cb.current.onTap?.({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }))
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => m.remove()
  }, [])

  // Re-fit only when what we're showing changes, not on every selection, pin, or GPS fix during a ride.
  const fitHere = route ? null : here
  useEffect(() => {
    // With a location, points come nearest-first: frame you and the closest few, not the whole city.
    const pts = route
      ? path
        ? path.flat()
        : route.via.map((v) => [v.lat, v.lng])
      : (fitHere ? points.slice(0, 6) : points).map((p) => [p.lat, p.lng])
    if (fitHere) pts.push([fitHere.lat, fitHere.lng])
    if (pts.length) map.current.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 16 })
  }, [route, path, points, fitHere])

  useEffect(() => {
    const g = layer.current
    g.clearLayers()
    const css = getComputedStyle(el.current)
    const color = (v) => css.getPropertyValue(v).trim()
    const dot = (pos, fill, radius = 6) =>
      L.circleMarker(pos, { radius, color: color('--ink'), weight: 3, fillColor: fill, fillOpacity: 1 }).addTo(g)

    if (route) {
      if (path) {
        L.polyline(path, { color: color('--ink'), weight: 9, opacity: 0.25, lineCap: 'round' }).addTo(g)
        L.polyline(path, { color: color('--red'), weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(g)
      }
      for (const stop of route.via) {
        const hit = stop.name === dest
        dot(
          [stop.lat, stop.lng],
          hit ? color('--yes') : stop.k === 't' ? color('--yellow') : '#fff',
          hit ? 9 : stop.k === 't' ? 7 : 5,
        ).bindTooltip(stop.name, { direction: 'top', permanent: hit })
      }
    } else {
      for (const p of points) {
        const on = p.key === active
        const fill = on ? color('--red') : p.t === 'trike' ? color('--trike') : color('--yellow')
        dot([p.lat, p.lng], fill, on ? 10 : p.t === 'trike' ? 6 : 8)
          .bindTooltip(p.name, { direction: 'top', permanent: on })
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e)
            cb.current.onPoint?.(p.key)
          })
      }
    }
    if (here) dot([here.lat, here.lng], '#2b6cff', 8).bindTooltip('You', { direction: 'top' })
    if (pin) dot([pin.lat, pin.lng], color('--red'), 11).bindTooltip('New ride spot', { direction: 'top', permanent: true })
  }, [route, path, dest, here, points, active, pin])

  const label = route ? `Map of the ${route.plakard} route` : 'Map of ride spots in Imus and Bacoor'
  return <div ref={el} className="map" role="img" aria-label={label} />
}
