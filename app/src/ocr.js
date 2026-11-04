import { createWorker } from 'tesseract.js'

const TARGET = 1600 // px on the long side; small phone crops get upscaled, huge photos downscaled

/** Grayscale + contrast stretch (2nd–98th percentile). Hand-painted boards often have low contrast and glare. */
export async function prepare(file, invert = false) {
  const bmp = await createImageBitmap(file)
  const k = TARGET / Math.max(bmp.width, bmp.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * k)
  canvas.height = Math.round(bmp.height * k)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = img.data
  const hist = new Uint32Array(256)
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000
    px[i] = g
    hist[g | 0]++
  }
  const clip = (px.length / 4) * 0.02
  let lo = 0
  let hi = 255
  let below = hist[0]
  let above = hist[255]
  while (lo < 254 && below < clip) below += hist[++lo]
  while (hi > 1 && above < clip) above += hist[--hi]
  const span = Math.max(hi - lo, 1)
  for (let i = 0; i < px.length; i += 4) {
    let v = Math.min(255, Math.max(0, ((px[i] - lo) * 255) / span))
    if (invert) v = 255 - v
    px[i] = px[i + 1] = px[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

const letters = (s) => s.replace(/[^A-Z]/g, '').length

// shortcut: Tesseract's worker, core and English model come from jsDelivr on first scan; the service worker caches them so later scans work offline.
export async function readPlakard(file, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => m.status === 'recognizing text' && onProgress(m.progress),
  })
  try {
    await worker.setParameters({ tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-. ' })
    const text = (await worker.recognize(await prepare(file))).data.text
    if (letters(text) >= 4) return text
    // Light letters on a dark board read as nothing; try the negative.
    const inverted = (await worker.recognize(await prepare(file, true))).data.text
    return letters(inverted) > letters(text) ? inverted : text
  } finally {
    await worker.terminate()
  }
}
