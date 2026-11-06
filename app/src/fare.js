// Fare estimates from the LTFRB fare matrices effective 2026-09-28, as published by PTV News:
// https://ptvnews.ph/ltfrb-releases-new-matrices-for-puv-fare-hikes-effective-sept-28/
// shortcut: hard-coded rates, update this table when LTFRB issues a new matrix.
// [minimum, km covered by the minimum, per km after], regular and student/senior/PWD.
const MATRIX = {
  jeep: { regular: [14, 4, 2], discount: [11.25, 4, 1.6] },
  modern: { regular: [17, 4, 2.4], discount: [13.5, 4, 1.92] },
  // We don't know which buses are aircon, so show the ordinary–aircon range.
  bus: { regular: [15, 5, 2.49], discount: [12, 5, 1.99], regularHi: [18, 5, 2.98], discountHi: [14.5, 5, 2.38] },
  uv: { regular: [0, 0, 2.6] }, // provisional per-km rate, no minimum
}

const price = ([min, covered, perKm], km) => min + Math.max(0, Math.ceil(km - covered)) * perKm
const quarter = (x) => Math.round(x * 4) / 4 // LTFRB fares come in 25-centavo steps
const peso = (x) => `₱${Number.isInteger(x) ? x : x.toFixed(2)}`

/**
 * Estimated fare for riding `km` on a ride of `kind`: { lo, hi, discount: [lo, hi] | null } in pesos, or null when we
 * can't estimate (P2P buses have fixed per-route fares).
 */
export function fare(kind, km) {
  const m = MATRIX[kind]
  if (!m || !(km >= 0)) return null
  return {
    lo: quarter(price(m.regular, km)),
    hi: quarter(price(m.regularHi ?? m.regular, km)),
    discount: m.discount ? [quarter(price(m.discount, km)), quarter(price(m.discountHi ?? m.discount, km))] : null,
  }
}

/** "about ₱18", "about ₱27–₱33", with the student/senior/PWD fare when there is one. */
export function fareText(f) {
  if (!f) return ''
  const money = (a, b) => (a === b ? peso(a) : `${peso(a)}–${peso(b)}`)
  return `about ${money(f.lo, f.hi)}${f.discount ? ` (${money(...f.discount)} student/senior/PWD)` : ''}`
}

/** Fare between two stops on a route, using the distance along the route stored with each stop. */
export function fareBetween(route, from, to) {
  const a = route.via.find((v) => v.name === from)
  const b = route.via.find((v) => v.name === to)
  return a && b ? fare(route.kind, Math.abs(b.km - a.km)) : null
}
