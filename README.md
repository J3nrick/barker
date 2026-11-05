# Barker

*Your pocket terminal barker.*

**Ask where to catch a ride to where you're going, or scan the signboard on a jeep, bus or UV to see where it passes.**

An open-source web app for commuters in **Imus and Bacoor, Cavite**. A jeepney signboard (*plakard*) only shows the two ends of the route, not the places in between. If you don't know the area, you also don't know where to catch your ride. That's the gap this app fills, like the barker at a jeepney terminal who calls out where each ride goes. (The project was first called *Dadaan Ba?*, Filipino for "Does it pass here?")

## How it works

Three ways in:

- **Ask** (voice or typing): "From SM Bacoor to Alabang", or just "PITX". The app lists every jeep, modern jeep, UV Express, bus and P2P that goes there and where to board it. With your location (or a "from" place) it shows only rides near you, and when nothing goes direct it suggests a trip **with one transfer**, e.g. "Zapote–Silang to Zapote, then change to Zapote–Alabang". Answers are read aloud. Uses the browser's Web Speech API (works best in Chrome on Android); Filipino and Taglish questions work too.
- **Ride spots**: a map and list of jeep, UV and bus terminals plus 49 tricycle and pedicab stands in Imus and Bacoor. With your location the nearest come first, each with walking directions. You can also **add a missing ride spot**: pin it on the map, save it on your phone, then send it to GitHub so it can be added for everyone.
- **Scan**: take a photo of a signboard.

How the scan works:

1. **Scan.** The photo is cleaned up first (grayscale, contrast stretch, and an inverted pass for light letters on dark boards), then read on the phone itself with [Tesseract.js](https://github.com/naptha/tesseract.js). No photo is uploaded.
2. **Match.** The text is fuzzy-matched against the known signboards, so a messy read like `SM M0LIN0 TREC` still lands. When the app isn't sure, it shows the top 3.
3. **Answer.** The route on a map, the stops along the way, and the answer to "Does it pass ___?"

Every route has a shareable link (`#route=imus-gma`), and the phone's Back button returns to the list instead of closing the app.

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

Routes come from **[OpenStreetMap](https://www.openstreetmap.org)**. [`app/tools/fetch_osm.py`](app/tools/fetch_osm.py) downloads the OSM extracts into `app/tools/osm/`, and [`app/tools/build_routes.py`](app/tools/build_routes.py) turns them into `app/src/routes.json` plus `app/public/paths.<hash>.json` (the route lines, kept separate so the first load is fast). A place counts as "on the route" when the route passes within 200 m of a landmark, 150 m of a terminal or 60 m of a stop. P2P buses only count their own stops.

```bash
python app/tools/fetch_osm.py    # refresh OSM data (slow when Overpass is busy)
python app/tools/build_routes.py
```

Current coverage (33 routes through Imus or Bacoor):

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
