// Self-check: npm run check
// shortcut: OCR strings are hand-made guesses, replace with real Tesseract output from plakard photos in week 1.
import { readFileSync } from 'node:fs'
import { match } from './matcher.js'
import { findPlace } from './voice.js'

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
}

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
console.log(`\n${pass}/${total} correct`)
if (pass !== total) process.exitCode = 1
