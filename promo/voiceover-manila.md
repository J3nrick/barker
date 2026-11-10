# Barker promo (Metro Manila): ElevenLabs voiceover script

For `barker-manila-9x16.mp4` and `barker-manila-16x9.mp4`: 35 seconds, 120 BPM beat already in the video.
Every line below is timed to a scene, so the voice lands on the same cuts as the beat.

---

## 1. Voice and settings

**The voice:** a warm, upbeat Filipino-English speaker, 25 to 35, who sounds like a friend who knows the city, not a TV announcer. Smiling, quick, confident. In the ElevenLabs **Voice Library**, search for **"Filipino"** or **"Tagalog"** and filter by **Conversational** or **Social media**. Preview with line 6 ("Para po!"): if that line doesn't sound natural, pick another voice.

**Model:** **Eleven v3** (it reads the [audio tags] in the script). If v3 isn't on your plan, use **Eleven Multilingual v2** with the plain version in section 4.

| Setting (v3) | Value |
| --- | --- |
| Stability | **Natural** (move to Creative if it sounds flat) |
| Speed | 1.0 (1.05 if a line runs long) |

| Setting (Multilingual v2) | Value |
| --- | --- |
| Stability | 40% |
| Similarity | 75% |
| Style exaggeration | 30% |
| Speaker boost | On |

**Generate each line separately** (copy one block at a time). Then each line can be placed exactly at its start time, and a bad take can be redone on its own.

---

## 2. The script (Eleven v3, English)

| # | Scene | Starts at | Must end by | Paste this into ElevenLabs |
| --- | --- | --- | --- | --- |
| 1 | Signboard slams in | 0.3 s | 2.9 s | `[curious] Cubao to Ayala... which ride gets me there?` |
| 2 | BARKER logo | 3.0 s | 4.9 s | `[excited] Meet Barker. The barker in your pocket.` |
| 3 | Just ask | 5.2 s | 9.8 s | `Just ask. Say where you're going... and Barker tells you what to ride.` |
| 4 | Which way to wait | 10.2 s | 13.8 s | `Even which platform to wait on.` |
| 5 | Every stop | 14.2 s | 18.8 s | `See every stop. Where to get on... and exactly where to get off.` |
| 6a | Get-off alert | 19.2 s | 22.2 s | `Then ride easy. Your phone tells you when you're close...` |
| 6b | "You're here" turns green | 22.4 s | 23.8 s | `[excited] Para po!` |
| 7 | Scan the signboard | 24.2 s | 27.8 s | `Not sure where a jeep goes? Scan the signboard.` |
| 8 | Ride-spot map | 28.2 s | 30.8 s | `Trains, jeeps, buses... all over Metro Manila.` |
| 9 | Outro | 31.2 s | 34.5 s | `[confident] Barker. Free, for every commuter.` |

About 75 words in 35 seconds, with room to breathe between lines. If a take runs past its "must end by" time, regenerate it, or raise the speed to 1.05. Don't cut words: every line matches what's on screen.

**Why it works:** it opens on a question every Manila commuter has asked, answers it within two seconds, and then each line names exactly what the screen is showing. "Para po!" lands on the beat the alert turns green, which is the moment people will remember.

---

## 3. Taglish version (Eleven v3)

Same timings. Use this one for TikTok and Reels in the Philippines: it sounds like a local, and the on-screen captions stay in English for everyone else.

| # | Starts at | Paste this into ElevenLabs |
| --- | --- | --- |
| 1 | 0.3 s | `[curious] Cubao papuntang Ayala... ano'ng sasakyan ko?` |
| 2 | 3.0 s | `[excited] Meet Barker. Ang barker sa bulsa mo.` |
| 3 | 5.2 s | `Itanong mo lang. Sabihin kung saan ka pupunta... sasabihin ni Barker kung ano'ng sasakyan.` |
| 4 | 10.2 s | `Pati kung saang platform ka maghihintay.` |
| 5 | 14.2 s | `Kita mo lahat ng hinto. Saan sasakay... at saan bababa.` |
| 6a | 19.2 s | `Relax lang sa biyahe. Sasabihan ka ng phone mo bago ka bumaba...` |
| 6b | 22.4 s | `[excited] Para po!` |
| 7 | 24.2 s | `Di sigurado kung saan dadaan ang jeep? I-scan ang plakard.` |
| 8 | 28.2 s | `Tren, jeep, bus... buong Metro Manila.` |
| 9 | 31.2 s | `[confident] Barker. Libre, para sa bawat commuter.` |

Line 3 is the longest; if it runs past 9.8 s, use `Itanong mo lang... sasabihin ni Barker kung ano'ng sasakyan.`

---

## 4. Plain version (Multilingual v2, no audio tags)

Multilingual v2 reads [tags] out loud, so use this instead. The "..." makes the pauses.

```
Cubao to Ayala... which ride gets me there?
Meet Barker. The barker in your pocket.
Just ask. Say where you're going... and Barker tells you what to ride.
Even which platform to wait on.
See every stop. Where to get on... and exactly where to get off.
Then ride easy. Your phone tells you when you're close...
Para po!
Not sure where a jeep goes? Scan the signboard.
Trains, jeeps, buses... all over Metro Manila.
Barker. Free, for every commuter.
```

---

## 5. Putting the voice on the video

**In CapCut or Premiere:** drop the video in (the beat is already on it), place each voice line at its "Starts at" time, and lower the video's audio to about **-8 dB while someone is speaking** (CapCut: Audio > Auto ducking).

**Or in one command** (after saving the voice as one file, `vo.mp3`, with the lines already placed at their times): this keeps the beat full between lines and ducks it under the voice automatically.

```bash
ffmpeg -i barker-manila-9x16.mp4 -i vo.mp3 -filter_complex "[1:a]asplit=2[vo][key];[0:a][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[beat];[beat][vo]amix=inputs=2:duration=first:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k barker-manila-9x16-vo.mp4
```

Change both file names to `16x9` for the wide version.

---

## 6. Before you post

- Listen once on phone speakers, not only headphones: the voice should be clear over the kick.
- The claims are safe as written: estimated fares, no live tracking or arrival times. If you change a line, keep it to what the app really does.
- Credit stays on screen at the end: "Map data © OpenStreetMap contributors".
- The beat is synthesized, so it's free to post anywhere. Your ElevenLabs plan decides whether you can use the voice commercially (paid plans include a commercial license; check yours).
