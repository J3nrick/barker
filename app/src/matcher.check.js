// Self-check: npm run check
// shortcut: OCR strings are hand-made guesses, replace with real Tesseract output from plakard photos in week 1.
import { readFileSync } from 'node:fs'
import { match } from './matcher.js'

const { routes } = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url)))

const cases = {
  'SM BACOOR - SM MOLINO': 'sm-bacoor-sm-molino', // clean
  'SM M0LIN0 SM BAC00R': 'sm-bacoor-sm-molino', // digit misreads, reversed board
  'SM MOLINO - TRECE': 'sm-molino-trece', // must not confuse with SM Bacoor–SM Molino
  'SM MOLIN0 TREC': 'sm-molino-trece',
  'SM MOLINO WALTERMART DASMA': 'sm-molino-waltermart-dasma',
  'IMUS GMA': 'imus-gma',
  'ZAPOTE SILANG': 'zapote-silang',
  'ZAPOT3 - S1LANG': 'zapote-silang',
  'PITX DASMARIÑAS': 'pitx-dasma', // Ñ
  'DISTRICT IMUS DISTRICT DASMA': 'district-imus-district-dasma',
  'VISTA MALL IMUS NOMO': 'vista-mall-imus-nomo',
  'BINAKAYAN ZAPOTE': 'binakayan-zapote', // must not confuse with Zapote–Silang
}

let pass = 0
for (const [ocr, want] of Object.entries(cases)) {
  const [top, second] = match(ocr, routes)
  const ok = top.route.id === want
  if (ok) pass++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  "${ocr}" → ${top.route.id} (${Math.round(top.score * 100)}%, 2nd ${second.route.id} ${Math.round(second.score * 100)}%)`,
  )
}
console.log(`\n${pass}/${Object.keys(cases).length} correct`)
if (pass !== Object.keys(cases).length) process.exitCode = 1
