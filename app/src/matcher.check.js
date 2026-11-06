// Self-check: npm run check
// shortcut: OCR strings are hand-made guesses, replace with real Tesseract output from plakard photos in week 1.
import { readFileSync } from 'node:fs'
import { match } from './matcher.js'
import { findPlace, parseTrip } from './voice.js'
import { heading, plan } from './trip.js'
import { rideStep } from './ride.js'
import { fare, fareBetween, fareText } from './fare.js'

import { expand, regionById } from './region.js'

const region = (id) => expand(JSON.parse(readFileSync(new URL(`../public/data/${id}.json`, import.meta.url))), regionById(id))
const cavite = region('cavite')
const { routes, places } = cavite

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
// Fares (LTFRB, Sept 2026): the minimum covers the first 4 km (jeep) or 5 km (bus); each started km after costs extra.
for (const [kind, km, want] of [
  ['jeep', 3, 'about ₱14 (₱11.25 student/senior/PWD)'],
  ['jeep', 6.5, 'about ₱20 (₱16 student/senior/PWD)'], // 14 + 3 km × 2; 11.25 + 3 × 1.60 = 16.05
  ['modern', 4, 'about ₱17 (₱13.50 student/senior/PWD)'],
  ['bus', 10, 'about ₱27.50–₱33 (₱22–₱26.50 student/senior/PWD)'], // ordinary 15 + 5 × 2.49, aircon 18 + 5 × 2.98
  ['uv', 10, 'about ₱26'],
  ['p2p', 10, ''],
]) {
  const got = fareText(fare(kind, km))
  report(got === want, `${kind} ${km} km: ${got || 'no estimate'}`)
}
// Metro Manila: rules-picked routes, trains, and places people name by nickname.
{
  const mnl = region('manila')
  const train = (ref) => mnl.routes.find((r) => r.kind === 'rail' && r.ref === ref)
  report(
    ['LRT-1', 'LRT-2', 'MRT-3'].every(train) && mnl.routes.filter((r) => r.kind === 'rail').length === 3,
    'manila: LRT-1, LRT-2, MRT-3, once each',
  )
  // PNR trains are suspended and the subway isn't open; the PNR replacement buses (refs PNR-1, PNR-2) do run.
  report(
    !mnl.routes.some((r) => r.kind === 'rail' && /PNR|SUBWAY|MMS/.test(`${r.plakard} ${r.ref}`)),
    'manila: no suspended or unopened train lines',
  )
  for (const [q, want] of [
    ['paano pumunta sa cubao', 'null > Cubao'],
    ['papuntang moa', 'null > SM Mall of Asia'], // nickname
    ['from Monumento to Taft Avenue', 'Monumento > Taft Avenue'], // station renamed for a sponsor
    ['galing Baclaran papuntang Quiapo', 'Baclaran > Quiapo'],
  ]) {
    const { from, to } = parseTrip(q, mnl.places)
    report(`${from} > ${to}` === want, `manila "${q}" → ${from} > ${to}`)
  }
  const go = (from, to) => plan(mnl.routes, mnl.placePos[from], to, mnl.placePos[to])
  report(go('Cubao', 'Ayala').direct[0]?.r === train('MRT-3'), 'manila Cubao → Ayala: the MRT-3 comes first')
  report(go('Quiapo', 'Alabang').transfers.length > 0 || go('Quiapo', 'Alabang').direct.length > 0, 'manila Quiapo → Alabang: a way there')
  report(match('LRT 1', mnl.routes)[0].route === train('LRT-1'), 'manila typing "LRT 1" finds the LRT-1')
  report(!mnl.places.includes('STI College'), 'manila: chain names far apart are told apart')
  report(fareText(fareBetween(train('MRT-3'), 'Cubao', 'Ayala')) === '', 'manila: no LTFRB estimate for trains')
}
console.log(`\n${pass}/${total} correct`)
if (pass !== total) process.exitCode = 1
