// Synthesizes the promo soundtracks: 120 BPM, so one beat = 15 frames and every scene cut lands on a beat.
// No samples: every sound is generated here, so there's nothing to license.
// Usage: node tools/beat.mjs out/beat.wav [promo|explainer]   (promo = 35 s first cut, explainer = 44 s clear cut)
import { writeFileSync } from 'node:fs'

const SR = 44100
const MODE = process.argv[3] ?? 'promo'
const LEN = MODE === 'explainer' ? 44 : 35
const BEAT = 0.5 // 120 BPM
const N = SR * LEN
const L = new Float32Array(N)
const R = new Float32Array(N)
const duck = new Float32Array(N).fill(1) // sidechain: the kick pushes the music down for a moment
let seed = 7
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const add = (t, fn, dur, pan = 0, ducked = false) => {
  const s0 = Math.floor(t * SR)
  for (let i = 0; i < dur * SR && s0 + i < N; i++) {
    const v = fn(i / SR) * (ducked ? duck[s0 + i] : 1)
    L[s0 + i] += v * (1 - pan)
    R[s0 + i] += v * (1 + pan)
  }
}
const hz = (n) => 440 * 2 ** ((n - 69) / 12)

function kick(t, gain = 1) {
  let ph = 0
  add(
    t,
    (x) => {
      ph += (2 * Math.PI * (45 + 110 * Math.exp(-x * 28))) / SR
      return Math.sin(ph) * Math.exp(-x * 7) * 0.9 * gain
    },
    0.45,
  )
  const s0 = Math.floor(t * SR)
  for (let i = 0; i < 0.3 * SR && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 0.35 + 0.65 * (i / (0.3 * SR)))
}
function clap(t, gain = 1) {
  let lp = 0
  add(
    t,
    (x) => {
      const n = noise()
      lp += 0.5 * (n - lp)
      const hits = [0, 0.011, 0.022].reduce((a, d) => a + (x >= d ? Math.exp(-(x - d) * (d < 0.02 ? 120 : 22)) : 0), 0)
      return (n - lp) * hits * 0.45 * gain
    },
    0.3,
  )
}
function hat(t, open = false, pan = 0.15) {
  let prev = 0
  add(
    t,
    (x) => {
      const n = noise()
      const v = n - prev
      prev = n
      return v * Math.exp(-x * (open ? 14 : 70)) * 0.13
    },
    open ? 0.3 : 0.08,
    pan,
  )
}
// Saw through a one-pole low-pass; `cut` is the filter amount (0..1).
function synth(t, notes, dur, { gain = 0.12, cut = 0.08, decay = 6, detune = 0.006, pan = 0 } = {}) {
  for (const n of notes)
    for (const d of [-detune, detune]) {
      let ph = 0
      let lp = 0
      add(
        t,
        (x) => {
          ph = (ph + (hz(n) * (1 + d)) / SR) % 1
          lp += cut * (ph * 2 - 1 - lp)
          return lp * Math.exp(-x * decay) * gain
        },
        dur,
        pan + d * 20,
        true,
      )
    }
}
function crash(t, gain = 1) {
  let prev = 0
  add(
    t,
    (x) => {
      const n = noise()
      const v = n - prev * 0.6
      prev = n
      return v * Math.exp(-x * 2.6) * 0.16 * gain
    },
    1.6,
  )
}
function riser(t, dur) {
  let lp = 0
  add(
    t,
    (x) => {
      const k = x / dur
      lp += (0.02 + 0.5 * k * k) * (noise() - lp)
      return lp * k * k * 0.5
    },
    dur,
  )
}
function sub(t, note, dur) {
  let ph = 0
  add(
    t,
    (x) => {
      ph += (2 * Math.PI * hz(note)) / SR
      return Math.sin(ph) * Math.min(1, x * 40) * Math.exp(-x * 1.2) * 0.35
    },
    dur,
  )
}

// A minor: Am - F - C - G, one chord per bar (4 beats).
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [55, 60, 64],
  [55, 59, 62],
]
const BASS = [45, 41, 48, 43]
const bar = (b) => b * 4 * BEAT

if (MODE === 'promo') {
  // 0-3 s, the hook: a riser into the signboard slam (frame 12 = 0.4 s), then a low drone under the question.
  riser(0, 0.4)
  kick(0.4, 1.2)
  crash(0.4, 1.2)
  sub(0.4, 33, 2.6)
  synth(0.4, [45, 52], 2.6, { gain: 0.07, cut: 0.03, decay: 0.8 })
  for (let b = 2; b < 6; b++) hat(b * BEAT, false)
  riser(2.0, 1.0)
  // 3 s, the logo stamp.
  kick(3, 1.2)
  clap(3, 1.2)
  crash(3)
  synth(3, [57, 64, 69], 1.2, { gain: 0.1, cut: 0.12, decay: 2.5 })

  // 5-28 s: the groove. Four on the floor, claps on 2 and 4, 16th hats, a pumping bass and offbeat stabs.
  const GROOVE = [5, 28]
  for (let t = GROOVE[0]; t < GROOVE[1] - 1e-9; t += BEAT) {
    const beat = Math.round((t - GROOVE[0]) / BEAT)
    const c = Math.floor(beat / 4) % 4
    kick(t)
    if (beat % 2 === 1) clap(t)
    for (let s = 0; s < 4; s++) hat(t + (s * BEAT) / 4, s === 2 && beat % 4 === 3, s % 2 ? -0.2 : 0.2)
    synth(t, [BASS[c]], BEAT * 0.9, { gain: 0.16, cut: 0.06, decay: 5 })
    synth(t + BEAT / 2, [BASS[c] + 12], BEAT * 0.4, { gain: 0.08, cut: 0.05, decay: 9 })
    synth(t + BEAT / 2, CHORDS[c], BEAT * 0.45, { gain: 0.045, cut: 0.15, decay: 8, pan: beat % 2 ? 0.25 : -0.25 })
  }
  // Every scene change gets a crash, right on its cut.
  for (const cut of [10, 14, 19, 24]) crash(cut, 0.8)
  // 22.4 s: "You're here. Para po!" lands with an extra hit.
  kick(22.4, 1)
  synth(22.4, [69, 72, 76], 0.8, { gain: 0.08, cut: 0.2, decay: 4 })
  riser(27, 1)

  // 28-31 s, the ride-spot map: the groove keeps going with a bright arpeggio as the dots rain in.
  for (let t = 28; t < 31 - 1e-9; t += BEAT) {
    kick(t)
    if (Math.round((t - 28) / BEAT) % 2) clap(t)
    for (let s = 0; s < 4; s++) {
      hat(t + (s * BEAT) / 4)
      synth(t + (s * BEAT) / 4, [[69, 72, 76, 81][s]], BEAT / 4, { gain: 0.05, cut: 0.25, decay: 14, pan: s % 2 ? 0.3 : -0.3 })
    }
    synth(t, [45], BEAT * 0.9, { gain: 0.16, cut: 0.06, decay: 5 })
  }
  riser(30, 1)

  // 31-35 s, outro: one big hit, then the chord rings out and fades.
  kick(31, 1.3)
  clap(31, 1.2)
  crash(31, 1.3)
  sub(31, 33, 4)
  synth(31, [57, 60, 64, 69], 4, { gain: 0.08, cut: 0.1, decay: 0.9 })
  synth(31.5, [76], 2.5, { gain: 0.04, cut: 0.2, decay: 1.2 })
}

if (MODE === 'explainer') {
  // One bar of groove per call site; options switch layers off to leave room for the voice.
  function groove(from, to, { clap: claps = true, bass = true, stabs = true } = {}) {
    for (let t = from; t < to - 1e-9; t += BEAT) {
      const beat = Math.round((t - from) / BEAT)
      const c = Math.floor(beat / 4) % 4
      kick(t)
      if (claps && beat % 2 === 1) clap(t)
      for (let s = 0; s < 4; s++) hat(t + (s * BEAT) / 4, s === 2 && beat % 4 === 3, s % 2 ? -0.2 : 0.2)
      if (bass) {
        synth(t, [BASS[c]], BEAT * 0.9, { gain: 0.16, cut: 0.06, decay: 5 })
        synth(t + BEAT / 2, [BASS[c] + 12], BEAT * 0.4, { gain: 0.08, cut: 0.05, decay: 9 })
      }
      if (stabs) synth(t + BEAT / 2, CHORDS[c], BEAT * 0.45, { gain: 0.045, cut: 0.15, decay: 8, pan: beat % 2 ? 0.25 : -0.25 })
    }
  }

  // 0-4 s, the problem: a low drone and ticking hats, a soft kick each bar, a riser into the answer.
  sub(0, 33, 4)
  synth(0, [45, 52], 4, { gain: 0.06, cut: 0.03, decay: 0.5 })
  for (let t = 0; t < 4 - 1e-9; t += BEAT / 2) hat(t, false)
  kick(0, 0.6)
  kick(2, 0.6)
  riser(3, 1)
  // 4 s, "Meet Barker": the big hit, then a light groove (no claps or bass) under the definition.
  kick(4, 1.3)
  clap(4, 1.2)
  crash(4, 1.2)
  synth(4, [57, 64, 69], 1.5, { gain: 0.1, cut: 0.12, decay: 2.2 })
  groove(4.5, 10, { clap: false, bass: false })
  riser(9, 1)
  // 10-34 s, the three steps and the scan: the full groove, a crash on every scene change.
  groove(10, 34)
  for (const cut of [10, 16, 24, 30]) crash(cut, 0.85)
  // 27.4 s: "You're here. Para po!" turns green.
  kick(27.4, 1)
  synth(27.4, [69, 72, 76], 0.8, { gain: 0.08, cut: 0.2, decay: 4 })
  // 34-38 s, coverage: the groove plus a bright arpeggio while the map fills.
  groove(34, 38, { stabs: false })
  for (let t = 34; t < 38 - 1e-9; t += BEAT / 4) {
    const k = Math.round((t - 34) / (BEAT / 4)) % 4
    synth(t, [[69, 72, 76, 81][k]], BEAT / 4, { gain: 0.05, cut: 0.25, decay: 14, pan: k % 2 ? 0.3 : -0.3 })
  }
  riser(37, 1)
  // 38-44 s, the ending: one big hit, a lighter groove, the chord rings out and fades.
  kick(38, 1.3)
  clap(38, 1.2)
  crash(38, 1.3)
  sub(38, 33, 3)
  synth(38, [57, 60, 64, 69], 3, { gain: 0.08, cut: 0.1, decay: 0.9 })
  groove(38.5, 42, { clap: false, stabs: false })
  synth(42, [57, 64, 69], 2, { gain: 0.07, cut: 0.1, decay: 1.2 })
}

// Master: fade the last 1.5 s, soft-clip, normalize, 16-bit stereo WAV.
let peak = 0
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (LEN - i / SR) / 1.5)
  L[i] = Math.tanh(L[i] * 1.4) * fade
  R[i] = Math.tanh(R[i] * 1.4) * fade
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}
const buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0)
buf.writeUInt32LE(36 + N * 4, 4)
buf.write('WAVEfmt ', 8)
buf.writeUInt32LE(16, 16)
buf.writeUInt16LE(1, 20)
buf.writeUInt16LE(2, 22)
buf.writeUInt32LE(SR, 24)
buf.writeUInt32LE(SR * 4, 28)
buf.writeUInt16LE(4, 32)
buf.writeUInt16LE(16, 34)
buf.write('data', 36)
buf.writeUInt32LE(N * 4, 40)
const g = 0.89 / peak
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4)
  buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4)
}
writeFileSync(process.argv[2] ?? 'out/beat.wav', buf)
console.log(`${MODE}: wrote ${LEN}s at 120 BPM, peak normalized from ${peak.toFixed(2)}`)
