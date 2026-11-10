# Barker explainer (Metro Manila): ElevenLabs voiceover script

For `Barker explainer 9x16.mp4` and `Barker explainer 16x9.mp4`: 44 seconds, the 120 BPM beat is already in the video.
Each line is timed to its scene and says the same thing as the words on screen, so the message is clear with the sound on or off.

---

## 1. Voice and settings

**The voice:** a warm, friendly Filipino-English speaker, 25 to 35, who sounds like a friend explaining a shortcut, not an announcer. Clear and unhurried. In the ElevenLabs **Voice Library**, search **"Filipino"** or **"Tagalog"** and filter by **Conversational**. Test with line 2: if "Meet Barker" doesn't sound warm and natural, try another voice.

**Model:** **Eleven v3** (it reads the [audio tags]). Without v3, use **Eleven Multilingual v2** and the plain version in section 4.

| Setting (v3) | Value |
| --- | --- |
| Stability | **Natural** |
| Speed | 1.0 (1.05 if a line runs past its end time) |

| Setting (Multilingual v2) | Value |
| --- | --- |
| Stability | 45% |
| Similarity | 75% |
| Style exaggeration | 25% |
| Speaker boost | On |

**Generate one line at a time,** so each can be placed at its start time and a weak take redone on its own.

---

## 2. The script (Eleven v3, English)

| # | On screen | Starts at | Must end by | Paste this into ElevenLabs |
| --- | --- | --- | --- | --- |
| 1 | "Which jeep? Which bus?" | 0.3 s | 3.8 s | `[curious] Going somewhere new in Metro Manila? Which jeep? Which bus?` |
| 2 | "Meet BARKER" | 4.3 s | 9.6 s | `[warm] Meet Barker. The free app that tells you exactly which jeep, bus or train to take.` |
| 3 | Step 1: Say where you're going | 10.3 s | 15.6 s | `Step one: say where you're going. Like... "from Cubao to Ayala."` |
| 4 | Step 2: Barker tells you what to ride | 16.3 s | 23.6 s | `Step two: Barker tells you what to ride... where to get on... which way to go... and about how much it costs.` |
| 5a | Step 3: Get a buzz before your stop | 24.3 s | 27.2 s | `Step three: your phone buzzes before your stop.` |
| 5b | The alert turns green | 27.4 s | 28.8 s | `[excited] Para po!` |
| 6 | Scan a jeep's signboard | 30.3 s | 33.6 s | `Not sure where a jeep goes? Scan its signboard.` |
| 7 | Across Metro Manila | 34.3 s | 37.6 s | `Trains, jeeps, buses and UV Express... across Metro Manila.` |
| 8 | BARKER, free, no sign-up | 38.4 s | 43.5 s | `[confident] Barker. The free commuter app for Metro Manila. No sign-up needed.` |

About 95 words in 44 seconds: a relaxed pace with a short gap at every cut.

**Why this is clearer:** the first two lines say the problem and exactly what Barker is, before any app screen appears. Then "Step one, step two, step three" tells viewers how to use it, and the last line repeats the name, the price (free) and the place.

---

## 3. Taglish version (Eleven v3)

Same timings. Good for TikTok and Reels in the Philippines; the on-screen words stay in English.

| # | Starts at | Paste this into ElevenLabs |
| --- | --- | --- |
| 1 | 0.3 s | `[curious] May bago kang pupuntahan sa Metro Manila? Anong jeep? Anong bus?` |
| 2 | 4.3 s | `[warm] Meet Barker. Ang libreng app na magsasabi kung anong jeep, bus o tren ang sasakyan mo.` |
| 3 | 10.3 s | `Una: sabihin kung saan ka pupunta. Halimbawa... "from Cubao to Ayala."` |
| 4 | 16.3 s | `Pangalawa: sasabihin ni Barker kung ano'ng sasakyan... saan sasakay... saan papunta... at magkano ang pamasahe.` |
| 5a | 24.3 s | `Pangatlo: magba-buzz ang phone mo bago ang babaan mo.` |
| 5b | 27.4 s | `[excited] Para po!` |
| 6 | 30.3 s | `Di sigurado kung saan dadaan ang jeep? I-scan ang plakard.` |
| 7 | 34.3 s | `Tren, jeep, bus at UV... buong Metro Manila.` |
| 8 | 38.4 s | `[confident] Barker. Ang libreng commuter app ng Metro Manila. Walang sign-up.` |

If line 4 runs past 23.6 s, use: `Pangalawa: sasabihin ni Barker kung ano'ng sasakyan, saan sasakay, at magkano.`

---

## 4. Plain version (Multilingual v2, no audio tags)

Multilingual v2 would read [tags] out loud, so use this. The "..." makes the pauses.

```
Going somewhere new in Metro Manila? Which jeep? Which bus?
Meet Barker. The free app that tells you exactly which jeep, bus or train to take.
Step one: say where you're going. Like... "from Cubao to Ayala."
Step two: Barker tells you what to ride... where to get on... which way to go... and about how much it costs.
Step three: your phone buzzes before your stop.
Para po!
Not sure where a jeep goes? Scan its signboard.
Trains, jeeps, buses and UV Express... across Metro Manila.
Barker. The free commuter app for Metro Manila. No sign-up needed.
```

---

## 5. Putting the voice on the video

**CapCut or Premiere:** drop in the video (the beat is already on it), place each line at its "Starts at" time, and turn on auto ducking (CapCut: Audio > Auto ducking) so the beat dips about 8 dB under the voice.

**Or one command** (save the voice as one file, `vo.mp3`, with each line placed at its time). It ducks the beat under the voice automatically:

```bash
ffmpeg -i "Barker explainer 9x16.mp4" -i vo.mp3 -filter_complex "[1:a]asplit=2[vo][key];[0:a][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[beat];[beat][vo]amix=inputs=2:duration=first:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "Barker explainer 9x16 with voice.mp4"
```

Use `16x9` in both names for the wide version. `Barker beat explainer 120bpm.wav` is the beat on its own, if you'd rather mix from scratch.

---

## 6. Before you post

- Play it once on phone speakers: the voice should be clear over the kick.
- Every claim matches the app: fares are estimates, there's no live tracking or arrival time, and the alert works from your phone's location.
- No link is in the video or the script. When you have the link or handle you want to share, put it in the post caption, or ask for it to be added to the last scene.
- Keep the credit at the end: "Map data © OpenStreetMap contributors".
- The beat is synthesized, so it's free to post anywhere. Whether you can use the ElevenLabs voice commercially depends on your plan.
