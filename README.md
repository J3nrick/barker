# Barker

*Your pocket terminal barker.*

**Ask where to catch a ride to where you're going, or scan the signboard on a jeep, bus or UV to see where it passes. Now in Metro Manila (with the LRT and MRT) and Cavite.**

An open-source web app for commuters in **Metro Manila** and **Imus and Bacoor, Cavite**. A jeepney signboard (*plakard*) only shows the two ends of the route, not the places in between. If you don't know the area, you also don't know where to catch your ride. That's the gap this app fills, like the barker at a jeepney terminal who calls out where each ride goes. (The project was first called *Dadaan Ba?*, Filipino for "Does it pass here?")

## How it works

On first open, pick your area (or let Barker pick it from your location); switch any time from the area button at the top. Three ways in, from the tab bar at the bottom:

- **Ask** (voice or typing): "From SM Bacoor to Alabang", or just "PITX". The app lists every jeep, modern jeep, UV Express, bus and P2P that goes there and where to board it. With your location (or a "from" place) it shows only rides near you, and when nothing goes direct it suggests a trip **with one transfer**, e.g. "Zapote–Silang to Zapote, then change to Zapote–Alabang". It also tells you **which side of the road to wait on**: "Board at SM Bacoor, toward ZAPOTE" means stand where traffic heads to Zapote. Each ride shows an **estimated fare** (regular and student/senior/PWD), from the [LTFRB fare matrices effective Sept 28, 2026](https://ptvnews.ph/ltfrb-releases-new-matrices-for-puv-fare-hikes-effective-sept-28/) and the distance along the route. City buses show an ordinary–aircon range. Trains, P2P and city-run buses (some free) set their own fares, so Barker says so instead of guessing. Answers are read aloud. Uses the browser's Web Speech API (works best in Chrome on Android); Filipino and Taglish questions work too.
- **Ride spots**: a map and list of train stations, jeep, UV and bus terminals, and tricycle and pedicab stands in your area. With your location the nearest come first, each with walking directions. You can also **add a missing ride spot**: pin it on the map, save it on your phone, then send it to GitHub so it can be added for everyone.
- **Scan**: take a photo of a signboard.

How the scan works:

1. **Scan.** The photo is cleaned up first (grayscale, contrast stretch, and an inverted pass for light letters on dark boards), then read on the phone itself with [Tesseract.js](https://github.com/naptha/tesseract.js). No photo is uploaded.
2. **Match.** The text is fuzzy-matched against the known signboards, so a messy read like `SM M0LIN0 TREC` still lands. When the app isn't sure, it shows the top 3.
3. **Answer.** The route on a map, the stops along the way, and the answer to "Does it pass ___?"

**Get-off alert:** on a route, pick your stop and tap **Alert me before…**. Barker follows your GPS while you ride, then vibrates and speaks about 500 m before your stop ("Get ready"), again at the stop ("Para po!"), and if you ride past it. Keep the screen on; Barker asks the phone to stay awake while it tracks. Your location never leaves the phone.

Every route has a shareable link (`#route=imus-gma&in=cavite`), and the phone's Back button returns to the list instead of closing the app.

It installs to the home screen (PWA). After the first use, the app, the OCR engine and the map tiles you've seen are cached, so it keeps working on a weak signal.

**Live:** https://barker-ph.vercel.app (mirror: https://j3nrick.github.io/barker/)

## Run it

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run check    # self-check: signboard matcher, questions, trip planner
npm run lint
npm run build
```

## Route data

Routes come from **[OpenStreetMap](https://www.openstreetmap.org)**, one file per area so the app only downloads the area you pick: `app/public/data/<area>.json` (routes, stops and ride spots), plus one small `app/public/paths/<area>/<route>.json` per route line, fetched when that route's map opens. A place counts as "on the route" when the route passes within 200 m of a landmark, 150 m of a terminal or station, or 60 m of a stop. P2P buses and trains only count their own stops.

```bash
python app/tools/fetch_osm.py           # Cavite: refresh OSM data (slow when Overpass is busy)
python app/tools/build_routes.py
python app/tools/fetch_osm.py manila    # Metro Manila (resumable; saves each batch)
python app/tools/build_manila.py
```

**Metro Manila** is picked by rules in [`build_manila.py`](app/tools/build_manila.py): the LRT and MRT, jeeps, city buses, UV Express, P2P and city-run buses (Q City Bus, BGC Bus, Pasig). Provincial buses, suspended lines (PNR, the Metro Manila Subway) and private shuttles are left out, and the two directions of a route become one. Today that's **282 routes**: the LRT-1, LRT-2 and MRT-3, 136 jeeps, 101 city and city-run buses, 18 UV Express and 24 P2P, plus 42 train stations, 236 terminals and 479 tricycle stands as ride spots. Chain names that repeat across the city ("STI College") are labelled by the nearest station, e.g. "STI College (near Taft Avenue)".

**Cavite** is a hand-checked list of 33 routes through Imus or Bacoor:

- **Jeep (11):** SM Bacoor–SM Molino, Imus–GMA, PITX–Dasma, SM Molino–WalterMart Dasma, SM Molino–Trece, District Imus–District Dasma, Binakayan–Zapote, Zapote–Alabang, SM Molino–Alabang, Tanza–PITX, Lancaster–Patindig Araw
- **Modern jeep (5):** Zapote–Silang, Vista Mall Imus–NOMO, SoMo–AllHome Kawit, SoMo–Vista Mall GenTri, Cavite City–Zapote
- **UV Express (5):** Bacoor–PITX, Molino–Lawton, Springville–Alabang, Springville–Ayala, Alabang–Imus
- **Bus (7):** Routes 26, 27, 28, 29, 31, 32 and 55 to PITX
- **P2P (5):** Imus–Makati, NoMo–Makati, SoMo–Makati, SoMo–Alabang, Imus–NAIA

> ⚠️ The exact signboard wording hasn't been confirmed on the road yet. The older routes from Zapote and SM Bacoor to Imus, Kawit, Noveleta and Tanza are still missing. See [CONTRIBUTING.md](CONTRIBUTING.md) to help.

## Contribute

You don't need to code. The biggest help is **signboard photos**, **correct routes**, and **missing ride spots** (you can add those right in the app, under Ride spots). Read [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

The full plan, data status and risks are in [PLAN.md](PLAN.md).

## License

- Code: [MIT](LICENSE)
- Route data: © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/)
