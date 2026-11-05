# Barker — Project Plan

*Formerly "Dadaan Ba?". A barker is the person at a jeepney terminal who calls out where each ride goes; this app does that job in your pocket.*

> **Ask where to catch your ride, or point your camera at a jeepney signboard, and the app tells you where it goes and whether it passes your stop.**

Open-source, offline-friendly web app for commuters in **Imus and Bacoor, Cavite**.

---

## 1. Problem

A jeepney signboard (*plakard*) only shows the **ends** of a route (e.g. "BACLARAN – IMUS"), not the **places in between**. Nobody tells you where to board either. If you don't know the area, your only option is to ask the driver, the barker or other passengers: loud, awkward, and sometimes wrong. No app answers the simple questions **"Where do I catch a ride to X?"** and **"Does this jeep pass where I'm going?"**

## 2. Target users

| User | Why they need it |
|---|---|
| New residents (Molino, Anabu, Daang Hari subdivisions) | Don't know the routes yet |
| Students and new employees | New commute every day |
| Visitors, returning OFWs | Routes have changed since they left |
| Seniors, people with poor eyesight | Signboards are hard to read from afar |
| People shy to ask | Prefer a quiet answer |

## 3. Solution

1. **Ask** — by voice or typing, "from X to Y" or just "Y". The app lists rides that go there and where to board; with a start point it shows only nearby rides, and suggests one-transfer trips when nothing goes direct.
2. **Ride spots** — terminals and tricycle stands nearby, with the rides that pass each one.
3. **Scan** — in-browser OCR (Tesseract.js) plus fuzzy matching against the closed list of known signboards. The read doesn't need to be perfect: the list is small, so even "BACLRAN IMUS" lands on "Baclaran – Imus". Below 80% confidence the user picks from the top 3, and typing is always a fallback.

## 4. How it differs

| | Google Maps / Moovit / Sakay.ph | **Barker** |
|---|---|---|
| Signboard scanner | ❌ | ✅ |
| Voice questions in English or Taglish | Partial | ✅ |
| Tricycle stands and local terminals | ❌ | ✅ |
| Works offline after first use | Partial | ✅ |
| Open data, community-maintained | ❌ | ✅ |

## 5. Status

### Done
- Signboard scan → route, stops, "Does it pass ___?"
- Ask by voice or text, "from X to Y", nearby rides, one-transfer trips, spoken answers
- 33 routes from OpenStreetMap: jeep, modern jeep, UV Express, city bus, P2P
- Ride spots: 18 terminals and 49 tricycle/pedicab stands, nearest first, walking directions
- Add a missing ride spot on the phone, then send it as a prefilled GitHub issue
- Route map, shareable route links, Back button support
- Get-off alert: GPS tracking with voice and vibration ~500 m before your stop, at the stop, and if you pass it
- Which side of the road to wait on, named by the signboard end you ride toward (skipped for loops and unclear routes)
- Installable PWA with offline caching; deployed on Vercel (auto-deploy from `main`) and GitHub Pages

### Next
| Version | Contents | Done when… |
|---|---|---|
| **v0.3** | Signboard photo test set; fix signboard wording from real photos | ≥ 85% correct matches on 50 real photos |
| **v0.4** | Test the get-off alert and road-side directions on 3 real trips; load both directions of each route from OSM | Alerts and directions right on 3 real trips |
| **v0.5** | Fares (LTFRB fare matrix), offline map tiles for Imus–Bacoor | Fare within ₱2 on 10 real trips |
| **v1.0** | All of Cavite (Dasmariñas, Kawit, GenTri), Play Store listing | 150+ verified routes |

## 6. Tech stack

| Part | Choice | Why |
|---|---|---|
| App | **React + Vite**, installable PWA | Runs in any phone browser, no app store needed |
| OCR | `tesseract.js` | Runs in the browser, free |
| Matching, questions, trips | Own JS (`matcher.js`, `voice.js`, `trip.js`) | Small, no dependencies, covered by `npm run check` |
| Voice | Web Speech API (`en-PH`) | Built into Chrome on Android |
| Map | Leaflet + OpenStreetMap tiles | Free, no API key |
| Data | OSM extracts → `routes.json` + `paths.<hash>.json` | Reviewable in PRs, no server |
| Backend | **None** | No cost, no maintenance |
| Hosting | Vercel (production), GitHub Pages (mirror) | Free for public repos |

## 7. Data

Built by `app/tools/build_routes.py` from OSM extracts fetched by `app/tools/fetch_osm.py`.

- **Routes:** OSM route relations listed in `ROUTES`, with our best-guess signboard text and aliases.
- **Places on a route:** curated landmarks (within 200 m), terminals (150 m) and stops (60 m). P2P buses count only their own stops.
- **Ride spots:** `amenity=bus_station`/`fx_station` terminals and `amenity=taxi` tricycle/pedicab stands inside Imus and Bacoor.

### Gaps
- **Missing from OSM:** the older jeeps from SM Bacoor/Zapote to Imus, Kawit, Noveleta, Rosario, Tanza, Tejero and Trece (listed on [CommuteTour SM Bacoor](https://ph.commutetour.com/ph/terminal/sm-bacoor/) but without paths), and Baclaran–Imus.
- **Unverified:** exact signboard wording, and whether each route still runs. Some OSM relations may be outdated.
- **Tricycles:** stands only; no routes or fares in OSM.

## 8. Data collection plan

1. **Terminal visits:** Imus Bayan, Bacoor Bayan / Zapote, SM Molino, Pala-Pala, District Imus. Photograph every signboard (front and side, day and night).
2. **Record the stops:** ride the top 10 routes, or ask drivers and barkers, and log landmarks.
3. **Map missing routes** in OpenStreetMap so every app benefits.
4. **Test set:** 50 signboard photos with known answers, to measure match accuracy each release.

## 9. Open source setup

- **License:** MIT for code; route data © OpenStreetMap contributors under **ODbL**.
- **Ways to contribute:** issue templates (signboard photo, new route, wrong route, new ride spot, bug), in-app "Add a ride spot", OSM mapping, code PRs.
- **CI:** a GitHub Actions workflow is ready in `ci/`; it needs the `workflow` token scope to enable (see `ci/README.md`).

## 10. Launch plan

1. **Pre-launch:** confirm 10 signboards from real photos; a 30-second demo video (ask → answer, scan → answer) shot at a real terminal.
2. **Channels:** Imus and Bacoor community Facebook groups, Cavite commuter groups, r/Philippines, r/Cavite, a dev.to "how I built it" post.
3. **Ask for help everywhere:** "Can't find your ride? Add it" in the app and in every post.
4. **Measure:** visits, questions asked, ride spots added, match accuracy, GitHub stars and contributors.

## 11. Risks

| Risk | Impact | Response |
|---|---|---|
| OCR can't read hand-painted or stylized signboards | High | Closed-list fuzzy match, top-3 picker, typing fallback; build the photo test set |
| Route data missing or outdated | High | OSM as the source; easy reporting; show "not yet confirmed" in the app |
| Transfer suggestions that make no sense on the road | Medium | Detour limit; collect real-trip feedback |
| Routes change (rerouting, new roads) | Medium | Community reports and OSM edits |
| No contributors | Medium | Make non-coder contributions one tap away |
| Copyright or franchise data issues | Low | Own field data and OSM only |
