# How to contribute

Thank you! Here are the ways to help, easiest first.

## 1. Send a signboard photo (no code)

Open an issue with the **"Signboard photo"** template. Attach the photo and write:
- where you took it (terminal or street), and
- exactly what the signboard says.

We use these photos to test the scanner and to fix the signboard wording in the data.

## 2. Report a new or wrong route (no code)

Use the **"New route"** or **"Wrong route"** template. Write the signboard text, the places it passes in order, and when you last rode it.

## 3. Add a ride spot (no code)

In the app, open **Ride spots**, tap **+ Add a ride spot**, pin the place on the map and save. It shows up on your phone right away. Tap **Send to GitHub** to open a prefilled **"New ride spot"** issue. A maintainer adds it to OpenStreetMap (`amenity=taxi` for tricycles, `amenity=bus_station` for terminals), and it appears for everyone after the next `fetch_osm.py`.

## 4. Map a route on OpenStreetMap

Our data comes from OpenStreetMap, so fixing a route there helps every app that uses it.
1. Map the route as a `type=route` + `route=share_taxi` (jeep) relation. Follow the [PH public transport guide](https://wiki.openstreetmap.org/wiki/Philippines/Public_transport).
2. Add the relation id to `ROUTES` in [`app/tools/build_routes.py`](app/tools/build_routes.py), with the signboard text.
3. Run `python app/tools/fetch_osm.py`, then `python app/tools/build_routes.py`.
4. Open a PR.

## 5. Code

```bash
cd app && npm install && npm run dev
```

Before opening a PR, make sure `npm run check`, `npm run lint` and `npm run build` pass. If you change `src/matcher.js`, `src/voice.js` or `src/trip.js`, add a case to `src/matcher.check.js`.

## Ground rules

- Be respectful. No insults or harassment.
- Don't copy data from apps that aren't open. Only your own observations and OpenStreetMap are accepted.
- English or Filipino are both fine.
