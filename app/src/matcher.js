// Matches noisy OCR text from a jeep plakard against a closed list of known routes.

// Common OCR misreads on painted letters. Applied to both sides, so it only has to be consistent.
const OCR_FIXES = { 0: 'O', 1: 'I', 5: 'S', 8: 'B', '|': 'I', $: 'S' }

/** Below this, show the top 3 for the user to pick instead of one answer. */
export const CONFIDENT = 0.8

export function normalize(s) {
  return s
    .toUpperCase()
    .replaceAll('Ñ', 'N')
    .replace(/[0158|$]/g, (c) => OCR_FIXES[c])
    .replace(/\bVIA\b/g, ' ') // "VIA" adds noise, not route identity
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

export const ratio = (a, b) => {
  const len = Math.max(a.length, b.length)
  return len === 0 ? 1 : 1 - levenshtein(a, b) / len
}

// Each candidate token is paired with its closest OCR token; order-independent so
// "IMUS BACLARAN" still hits "BACLARAN - IMUS". Missing words cost coverage.
function tokenScore(ocr, cand) {
  const o = ocr.split(' ')
  const c = cand.split(' ')
  if (!o[0]) return 0
  const sum = c.reduce((s, ct) => s + Math.max(...o.map((ot) => ratio(ot, ct))), 0)
  return sum / Math.max(o.length, c.length)
}

export function score(ocrText, candidate) {
  const a = normalize(ocrText)
  const b = normalize(candidate)
  return Math.max(ratio(a.replaceAll(' ', ''), b.replaceAll(' ', '')), tokenScore(a, b))
}

/** Top n routes, best first: [{ route, score }]. */
export function match(ocrText, routes, n = 3) {
  return routes
    .map((route) => ({
      route,
      score: Math.max(...[route.plakard, ...(route.aliases ?? [])].map((c) => score(ocrText, c))),
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
}
