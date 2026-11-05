// "Saan ang sakayan papuntang SM Molino?" -> "SM Molino". Shared by the mic and the typed question.
import { normalize, ratio } from './matcher.js'

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
export const canListen = Boolean(Recognition)

/** One utterance in Philippine English; place names and Taglish come through fine. Resolves to the transcript. */
export function listen() {
  return new Promise((resolve, reject) => {
    const r = new Recognition()
    r.lang = 'en-PH'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => resolve(e.results[0][0].transcript)
    r.onerror = (e) => reject(e.error)
    r.onend = () => resolve('')
    r.start()
  })
}

export function say(text) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voices = speechSynthesis.getVoices()
  u.voice = voices.find((v) => v.lang === 'en-PH') ?? voices.find((v) => v.lang.startsWith('en')) ?? null
  u.lang = u.voice?.lang ?? 'en-PH'
  speechSynthesis.speak(u)
}

// Question words and fillers people wrap around the place name, in English and Filipino.
const FILLER = new Set(
  `SAAN SAN ANG YUNG UNG SAKAYAN SAKAY SASAKAY SUMAKAY PAPUNTA PAPUNTANG PUNTA PUPUNTA PUMUNTA PAPUNTANG
   PA SA NG NA BA PO KO AKO TAYO GUSTO DADAAN DUMADAAN DAAN JEEP JEEPNEY BUS UV P2P ANONG ANO MAY
   PAANO PANO PUWEDE PWEDE MAKARATING RATING HOW WHERE TO GO GET RIDE IS THE A I WANT WHICH TAKE IN AT DO DOES
   CAN CATCH BOARD WHAT MY ME FIND NEAREST NEAR STOP PASS PASSES THROUGH IT THIS THAT FOR GOING HEADING`.split(/\s+/),
)
// Words that alone don't identify a place, so they don't count toward a match.
const GENERIC = new Set(['SM', 'CITY', 'MALL', 'THE', 'OF', 'HALL', 'TERMINAL', 'CENTER', 'TRANSPORT', 'STATION', 'MAIN', 'BUILDING'])
// What people say -> how the place is written.
const SPOKEN = { DASMA: 'DASMARINAS', GENTRI: 'GENERAL TRIAS', TRECE: 'TRECE MARTIRES', AYALA: 'MAKATI', GMA: 'GMA' }

// A clipped word ("MOLIN", "DASMARINA") still counts; otherwise plain edit-distance similarity.
const similar = (w, t) => (w.length >= 4 && t.startsWith(w) ? 0.9 : ratio(w, t))

/** Best place in `places` for a free-text question, or null when nothing fits well. */
export function findPlace(question, places) {
  const words = normalize(question)
    .split(' ')
    .filter((w) => w && !FILLER.has(w))
    .flatMap((w) => (SPOKEN[w] ?? w).split(' '))
  if (!words.length) return null
  let best = null
  for (const place of places) {
    // "Imus Cathedral (Bayan)" can be asked for as a whole or by either part; a part alone ranks a bit lower.
    const [, out, inside] = place.match(/^(.*?)\s*(?:\((.*)\))?$/)
    const names = inside
      ? [
          [place, 0],
          [out, 0.05],
          [inside, 0.05],
        ]
      : [[place, 0]]
    for (const [name, cost] of names) {
      const all = normalize(name).split(' ')
      const key = all.filter((t) => !GENERIC.has(t))
      const toks = key.length ? key : all
      // The place's words must be said, and the words said should belong to the place.
      const covered = toks.reduce((sum, t) => sum + Math.max(...words.map((w) => similar(w, t))), 0) / toks.length
      const used = words.reduce((sum, w) => sum + Math.max(...all.map((t) => similar(w, t))), 0) / words.length
      const s = covered + used / 2 - cost
      if (covered >= 0.75 && (!best || s > best.s)) best = { place, s }
    }
  }
  return best?.place ?? null
}

const FROM = new Set(['MULA', 'GALING', 'FROM'])
const TO = new Set(['PAPUNTA', 'PAPUNTANG', 'PUNTA', 'PUPUNTA', 'HANGGANG', 'TO', 'GOING', 'HEADING', 'TOWARDS'])

/** "From SM Bacoor to PITX" (or "galing SM Bacoor papuntang PITX") -> { from: 'SM Bacoor', to: 'PITX' }. Without a "from", it's all destination. */
export function parseTrip(question, places) {
  const part = { from: [], to: [] }
  let into = 'to'
  for (const w of normalize(question).split(' ')) {
    if (FROM.has(w)) into = 'from'
    else if (TO.has(w)) into = 'to'
    else part[into].push(w)
  }
  const from = part.from.length ? findPlace(part.from.join(' '), places) : null
  return {
    from,
    to: findPlace(
      part.to.join(' '),
      places.filter((p) => p !== from),
    ),
  }
}
