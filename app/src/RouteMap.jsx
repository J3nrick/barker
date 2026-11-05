import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// shortcut: tiles load from tile.openstreetmap.org, so the map needs internet; pre-cache Imus–Bacoor tiles for offline (v0.2).
/**
 * One route with its stops, or (with `points`) a set of sakayan to pick from.
 * `onTap` gets {lat, lng} for map taps (to drop a pin when adding a sakayan); `pin` draws that pin.
 */
export default function RouteMap({ route, dest, here, points, active, onPoint, onTap, pin }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const cb = useRef({})
  useEffect(() => {
    cb.current = { onPoint, onTap }
  })

  // One map for the component's life, so tapping or selecting doesn't reset the view.
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
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

  // Re-fit only when what we're showing changes, not on every selection or pin.
  useEffect(() => {
    // With a location, points come nearest-first: frame you and the closest few, not the whole city.
    const pts = route ? route.path.flat() : (here ? points.slice(0, 6) : points).map((p) => [p.lat, p.lng])
    if (here && !route) pts.push([here.lat, here.lng])
    if (pts.length) map.current.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 16 })
  }, [route, points, here])

  useEffect(() => {
    const g = layer.current
    g.clearLayers()
    const css = getComputedStyle(el.current)
    const color = (v) => css.getPropertyValue(v).trim()
    const dot = (pos, fill, radius = 6) =>
      L.circleMarker(pos, { radius, color: color('--ink'), weight: 3, fillColor: fill, fillOpacity: 1 }).addTo(g)

    if (route) {
      L.polyline(route.path, { color: color('--ink'), weight: 9, opacity: 0.25, lineCap: 'round' }).addTo(g)
      L.polyline(route.path, { color: color('--red'), weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(g)
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
    if (here) dot([here.lat, here.lng], '#2b6cff', 8).bindTooltip('Ikaw', { direction: 'top' })
    if (pin) dot([pin.lat, pin.lng], color('--red'), 11).bindTooltip('Bagong sakayan', { direction: 'top', permanent: true })
  }, [route, dest, here, points, active, pin])

  const label = route ? `Mapa ng rutang ${route.plakard}` : 'Mapa ng mga sakayan sa Imus at Bacoor'
  return <div ref={el} className="map" role="img" aria-label={label} />
}
