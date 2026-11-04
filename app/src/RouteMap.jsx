import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// shortcut: tiles load from tile.openstreetmap.org, so the map needs internet; pre-cache Imus–Bacoor tiles for offline (v0.2).
export default function RouteMap({ route, dest }) {
  const el = useRef(null)

  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const css = getComputedStyle(el.current)
    const red = css.getPropertyValue('--red').trim()
    const ink = css.getPropertyValue('--ink').trim()
    const line = L.polyline(route.path, { color: ink, weight: 9, opacity: 0.25, lineCap: 'round' }).addTo(map)
    L.polyline(route.path, { color: red, weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(map)

    for (const stop of route.via) {
      const hit = stop.name === dest
      L.circleMarker([stop.lat, stop.lng], {
        radius: hit ? 9 : 6,
        color: ink,
        weight: 3,
        fillColor: hit ? css.getPropertyValue('--yes').trim() : '#fff',
        fillOpacity: 1,
      })
        .bindTooltip(stop.name, { direction: 'top', permanent: hit })
        .addTo(map)
    }
    map.fitBounds(line.getBounds(), { padding: [24, 24] })
    return () => map.remove()
  }, [route, dest])

  return <div ref={el} className="map" role="img" aria-label={`Mapa ng rutang ${route.plakard}`} />
}
