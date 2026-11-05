// Self-check: npm run check
// shortcut: OCR strings are hand-made guesses, replace with real Tesseract output from plakard photos in week 1.
import { readFileSync } from 'node:fs'
import { match } from './matcher.js'
import { findPlace, parseTrip } from './voice.js'
import { heading, plan } from './trip.js'
import { rideStep } from './ride.js'

const { routes } = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url)))
const places = [...new Set(routes.flatMap((r) => r.via.map((v) => v.name)))]

// An array means "both of these, in any order": the same two ends really are painted on a jeep and a bus.
const cases = {
  'SM BACOOR - SM MOLINO': 'sm-bacoor-sm-molino', // clean
  'SM M0LIN0 SM BAC00R': 'sm-bacoor-sm-molino', // digit misreads, reversed board
  'SM MOLINO - TRECE': 'sm-molino-trece', // must not confuse with SM Bacoor–SM Molino
  'SM MOLIN0 TREC': 'sm-molino-trece',
  'SM MOLINO WALTERMART DASMA': 'sm-molino-waltermart-dasma',
  'IMUS GMA': 'imus-gma',
  'ZAPOTE SILANG': 'zapote-silang',
  'ZAPOT3 - S1LANG': 'zapote-silang',
  'PITX DASMARIÑAS': ['pitx-dasma', 'dasmarinas-pitx'], // Ñ; modern jeep and city bus share the ends
  'DISTRICT IMUS DISTRICT DASMA': 'district-imus-district-dasma',
  'VISTA MALL IMUS NOMO': 'vista-mall-imus-nomo',
  'BINAKAYAN ZAPOTE': 'binakayan-zapote', // must not confuse with Zapote–Silang
  'TRECE MARTIRES PITX': 'trece-martires-pitx',
  'NAIC - PITX': 'naic-pitx',
  'SM MOLINO ALABANG': 'sm-molino-alabang',
  'BACOOR PITX': 'bacoor-pitx',
  'CAVITE CITY ZAPOTE': 'cavite-city-zapote', // must not confuse with Cavite City–PITX
}

// Spoken or typed questions -> the place we should answer about.
const questions = {
  'saan ang sakayan papuntang SM Molino': 'SM Molino',
  'paano pumunta sa PITX': 'PITX',
  'san sasakay papuntang molino': 'SM Molino',
  'dadaan ba sa imus transport plaza': 'Imus Transport Plaza',
  'where do i ride to the district imus': 'The District Imus',
  'saan ang sakayan pa zapote': 'Zapote',
  'papunta ako sa alabang': 'Alabang',
  'saan po ang sakayan ng P2P papuntang Makati': 'Makati',
  'saan ang sakayan papuntang asdfgh': null,
  'papuntang somo': 'SoMo (Molino)', // the part outside the brackets is enough
  'how do i get to the nearest stop for pitx': 'PITX',
  'does it pass sm molino': 'SM Molino',
}

// "From X to Y" / "galing X papuntang Y", in either order.
const trips = {
  'galing SM Bacoor papuntang PITX': 'SM Bacoor > PITX',
  'papuntang PITX mula sa imus transport plaza': 'Imus Transport Plaza > PITX',
  'saan ang sakayan papuntang zapote': 'null > Zapote',
  'from SM Bacoor to PITX': 'SM Bacoor > PITX',
  'going to alabang from imus transport plaza': 'Imus Transport Plaza > Alabang',
}

// Trip planner: [from, to, what the first answer must be]
const pos = Object.fromEntries(routes.flatMap((r) => r.via.map((v) => [v.name, v])))
const plans = [
  ['SM Bacoor', 'SM Molino', 'direct sm-bacoor-sm-molino'],
  ['Imus Transport Plaza', 'Alabang', 'direct alabang-imus'],
  ['Lancaster Filcab Station', 'SM Molino', 'none'], // only shared stop is PITX: a detour, not a transfer
  ['SM Bacoor', 'Alabang', 'transfer zapote-silang+zapote-alabang'], // change at Zapote
  ['Imus Transport Plaza', 'Makati', 'transfer zapote-silang+imus-makati'], // change to the P2P at The District Imus
]

let pass = 0
let total = 0
const report = (ok, line) => {
  total++
  if (ok) pass++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${line}`)
}
for (const [ocr, want] of Object.entries(cases)) {
  const [top, second] = match(ocr, routes)
  const got = Array.isArray(want) ? [top.route.id, second.route.id].sort() : top.route.id
  const ok = Array.isArray(want) ? got.join() === [...want].sort().join() : got === want
  report(ok, `"${ocr}" → ${top.route.id} (${Math.round(top.score * 100)}%, 2nd ${second.route.id} ${Math.round(second.score * 100)}%)`)
}
for (const [q, want] of Object.entries(questions)) {
  const got = findPlace(q, places)
  report(got === want, `"${q}" → ${got}`)
}
for (const [q, want] of Object.entries(trips)) {
  const { from, to } = parseTrip(q, places)
  report(`${from} > ${to}` === want, `"${q}" → ${from} > ${to}`)
}
for (const [from, to, want] of plans) {
  const t = plan(routes, pos[from], to, pos[to])
  const got = t.direct[0]
    ? `direct ${t.direct[0].r.id}`
    : t.transfers[0]
      ? `transfer ${t.transfers[0].a.id}+${t.transfers[0].b.id}`
      : 'none'
  report(got === want, `${from} → ${to}: ${got}`)
}
// Which way to face: [route, board, get off, signboard end you ride toward]
const byId = Object.fromEntries(routes.map((r) => [r.id, r]))
for (const [id, from, to, want] of [
  ['sm-bacoor-sm-molino', 'SM Bacoor', 'SM Molino', 'SM MOLINO'],
  ['sm-bacoor-sm-molino', 'SM Molino', 'SM Bacoor', 'SM BACOOR'],
  ['zapote-silang', 'Zapote', 'Imus Transport Plaza', 'SILANG'],
  ['zapote-silang', 'Imus Transport Plaza', 'Zapote', 'ZAPOTE'],
  ['gma-pitx', 'General Mariano Alvarez Transport Terminal', 'PITX', 'PITX'],
  ['cavite-city-pitx', 'PITX', 'Saint Anthony of Padua Bus Terminal', 'CAVITE CITY'], // first stop isn't called "Cavite City"
  ['binakayan-zapote', 'Zeus', 'Talaba', null], // a one-way loop has no end to face
]) {
  const got = byId[id].via.some((v) => v.name === from) ? heading(byId[id], from, to) : `no stop ${from}`
  report(got === want, `${id} ${from} → ${to}: toward ${got}`)
}

// Get-off alert: a ride toward a stop, with a bad GPS fix and some jitter on the way.
{
  const stop = { lat: 14.4, lng: 120.95 }
  const at = (kmNorth, acc = 0.01) => ({ lat: 14.4 + kmNorth / 111.2, lng: 120.95, acc })
  const fixes = [at(2), at(0.4), at(0.1, 0.5), at(0.1), at(0.12), at(-0.5)]
  const want = 'riding soon soon here here passed'
  let s = null
  const got = fixes.map((f) => (s = rideStep(s, f, stop)).phase).join(' ')
  report(got === want, `ride alert phases: ${got}`)
}
console.log(`\n${pass}/${total} correct`)
if (pass !== total) process.exitCode = 1
