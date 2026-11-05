# Dadaan Ba? — Project Plan

> **I-point mo ang camera sa plakard ng jeep, at sasabihin nito kung saan dadaan — at kung dadaan ba sa pupuntahan mo.**

Open-source, offline-first na app para sa mga commuter sa **Imus at Bacoor, Cavite** (v0.1).

---

## 1. Problema

Ang plakard ng jeep ay nagsasabi lang ng **dulo** ng ruta (hal. "BACLARAN – IMUS"), hindi ng **mga dinadaanan**. Kapag hindi ka pamilyar sa lugar, ang tanging paraan ay magtanong sa driver, barker o kapwa pasahero — maingay, nakakahiya, at minsan mali ang sagot. Walang app ngayon na sumasagot sa simpleng tanong na: **"Dadaan ba 'tong jeep na 'to sa pupuntahan ko?"**

## 2. Target users

| User | Bakit kailangan nila |
|---|---|
| Bagong residente (Molino, Anabu, Daang Hari subdivisions) | Hindi pa kabisado ang ruta |
| Estudyante / bagong empleyado | Bagong biyahe araw-araw |
| Bisita, OFW pauwi | Nagbago na ang ruta mula noon |
| Senior / malabo ang mata | Mahirap basahin ang plakard mula malayo |
| Mahiyaing magtanong | Mas gusto ang tahimik na sagot |

## 3. Solusyon

1. **Scan** — I-point ang camera sa plakard.
2. **Match** — In-browser OCR (Tesseract.js) → fuzzy match sa listahan ng kilalang plakard. Hindi kailangang perpekto ang basa: maliit at sarado ang listahan (~30–50 ruta), kaya kahit "BACLRAN IMUS" ay tatama sa "Baclaran – Imus".
3. **Answer** — Ipakita ang ruta sa mapa, listahan ng mga dinadaanang landmark, at sagot sa "Dadaan ba sa ___?" kasama kung saan bababa.

Kung mababa ang confidence (< 80%), ipapakita ang top 3 at ang user ang pipili. Laging may **manual search** bilang fallback.

## 4. Kaibahan sa iba

| | Google Maps / Moovit / Sakay.ph | **Dadaan Ba?** |
|---|---|---|
| Plakard scanner | ❌ | ✅ |
| Kailangang alam ang destination at mag-type | Oo | Hindi — scan lang |
| Gumagana offline | Bahagya | ✅ Buo |
| Open data, community-maintained | ❌ | ✅ |
| Focus sa jeep routes ng Cavite | Mahina ang data | ✅ |

## 5. Scope

### v0.1 — "Gumagana sa Imus–Bacoor" (target: 4 na linggo)
- ✅ Plakard scan → ruta + dinadaanan
- ✅ "Dadaan ba sa ___?" (pumili o i-type ang landmark)
- ✅ Manual search ng ruta
- ✅ Mapa ng ruta (OpenStreetMap)
- ✅ Buong offline — naka-bundle ang data
- ✅ Jeep lang, Imus + Bacoor lang
- ✅ Android muna (dito ang karamihan ng user)

### Hindi kasama sa v0.1 (sadyang ipinagpaliban)
Voice, GPS "malapit ka na bumaba" alert, pamasahe, bus/UV/tricycle, ibang lungsod, user accounts, iOS release.

## 6. Roadmap

| Version | Laman | Done kapag… |
|---|---|---|
| **v0.1** | Scan + route info, Imus–Bacoor jeeps | ≥ 85% tamang match sa 50 totoong litrato ng plakard |
| **v0.2** | GPS "bababa ka na" alert, Filipino text-to-speech na sagot | Nag-a-alert sa tamang landmark sa 3 totoong biyahe |
| **v0.3** | "Mag-report ng ruta" form sa app → GitHub issue; pamasahe (LTFRB fare matrix) | 5 ruta na galing sa ibang contributor |
| **v0.4** | Voice na tanong ("Saan sasakay papuntang SM Molino?") | Gumagana sa `fil-PH` sa labas, may ingay |
| **v1.0** | Buong Cavite (Dasmariñas, Kawit, GenTri), UV Express, iOS | 150+ verified routes, Play Store release |

## 7. Tech stack

| Parte | Pinili | Bakit |
|---|---|---|
| App | **React + Vite**, installable PWA | Gumagana sa kahit anong phone browser, walang app store |
| OCR | `tesseract.js` | Tumatakbo sa browser mismo, libre |
| Fuzzy match | Sariling JS function (`src/matcher.js`) | ~60 lines, walang dependency |
| Mapa | `react-leaflet` + OpenStreetMap tiles (v0.2) | Libre, walang API key |
| Offline tiles | Pre-downloaded tiles ng Imus–Bacoor (v0.2) | Para gumana kahit walang data |
| Data | JSON / GeoJSON files sa repo, naka-bundle sa app | Madaling i-review sa PR, walang server |
| Backend | **Wala** sa v0.1 | Walang gastos, walang maintenance |
| CI | GitHub Actions: `npm run lint`, `npm run check`, `npm run build`; deploy sa GitHub Pages | Libre sa public repo |

## 8. Data model

`data/routes/baclaran-imus.json`
```json
{
  "id": "baclaran-imus",
  "plakard": "BACLARAN - IMUS",
  "aliases": ["IMUS - BACLARAN", "BACLARAN IMUS"],
  "type": "jeep",
  "terminals": ["Baclaran", "Imus Bayan"],
  "via": [
    { "name": "Zapote", "lat": 0, "lng": 0 },
    { "name": "Bacoor Bayan", "lat": 0, "lng": 0 },
    { "name": "Imus Plaza", "lat": 0, "lng": 0 }
  ],
  "path": "data/paths/baclaran-imus.geojson",
  "verified_by": "github-username",
  "verified_on": "2026-11-04"
}
```
*(Halimbawa lang — ang totoong dinadaanan at coordinates ay ive-verify sa field.)*

`data/landmarks.json` — mga kilalang lugar (SM Bacoor, SM Molino, Imus Plaza, District Imus, Robinsons Imus, Bacoor City Hall, atbp.) na may aliases para sa search ("SM Molino" = "Molino SM").

Isang CI script ang magche-check na: valid ang JSON, may `plakard` at ≥ 3 `via`, umiiral ang `path` file, at walang duplicate na `id`.

## 8b. Data status (as of 2026-11-05)

Ang route data ay galing na sa **OpenStreetMap** (`app/tools/build_routes.py` → `app/src/routes.json`). Totoong path, operator at mga kalsada ito, at awtomatikong kinukuha ang mga landmark na nasa loob ng 200 m ng ruta.

| Plakard (hula, kailangan ng litrato) | OSM relation | Operator (OSM) |
|---|---|---|
| SM BACOOR - SM MOLINO (via Mambog) | 17922478 / 17934695 | — |
| IMUS - GMA (via Pala-Pala, Paliparan) | 10092672 / 10150609 | Zapote-Imus-Dasmariñas-GMA-Pala-Pala-Paliparan TC |
| ZAPOTE - SILANG (modern) | 10141458 | Silang TSDC |
| PITX - DASMA | 10018379 | Kapit-Bisig TSC |
| SM MOLINO - WALTERMART DASMA | 10316636 | Magnificat TC |
| SM MOLINO - TRECE | 8853767 | CALABARZON TSC |
| DISTRICT IMUS - DISTRICT DASMA | 10600896 | — |
| VISTA MALL IMUS - NOMO (modern) | 14196973 | MetroExpress Connect |
| BINAKAYAN - ZAPOTE | 18185851 | — |

**Idinagdag noong 2026-11-05 (v0.2, hindi na lang jeep):** 24 pang ruta mula sa OSM, kaya 33 na lahat. Kasama rito ang mga jeep (Zapote–Alabang, SM Molino–Alabang, Tanza–PITX, Lancaster–Patindig Araw), modern jeep (SoMo–AllHome Kawit, SoMo–Vista Mall GenTri, Cavite City–Zapote), UV Express (Bacoor–PITX, Molino–Lawton, Springville–Alabang/Ayala, Alabang–Imus), city bus (Routes 26/27/28/29/31/32/55 papuntang PITX) at P2P (Imus/NoMo/SoMo–Makati, SoMo–Alabang, Imus–NAIA). Nasa `ROUTES` sa `build_routes.py` ang buong listahan.

**Mga sakayan:** ang mga stop at platform ng bawat OSM route relation, pati ang mga `amenity=bus_station` na terminal, ay nagiging lugar na puwedeng tanungin at sakayan na puwedeng ituro. Ito ang ginagamit ng mode na "Itanong" (boses o type) at "Mga sakayan".

**Mga kulang (wala sa OSM, kailangang i-mapa sa field):** ang mga lumang jeep mula SM Bacoor/Zapote papuntang Imus, Kawit, Noveleta, Rosario, Tanza, Tejero at Trece. Nakalista ang mga ito sa [CommuteTour SM Bacoor](https://ph.commutetour.com/ph/terminal/sm-bacoor/) pero walang path. Kasama rin dito ang Baclaran–Imus.

**Ang hindi pa verified:** ang eksaktong pagkakasulat sa plakard at kung tumatakbo pa ang bawat ruta. Puwedeng luma ang ilang OSM relation.

## 9. Data collection plan

1. **Field trip sa mga terminal:** Imus Bayan, Bacoor Bayan / Zapote, SM Molino, Pala-pala, District Imus. Kunan ang bawat plakard (harap at gilid, araw at gabi).
2. **Itala ang dinadaanan:** sumakay sa top 10 ruta, o tanungin ang driver/barker, at i-record ang landmarks.
3. **Iguhit ang path:** gamitin ang [geojson.io](https://geojson.io) sa ibabaw ng OSM roads.
4. **Test set:** `test/plakard_photos/` — 50 litrato na may tamang sagot, para masukat ang match accuracy sa bawat release.

Unang 10 ruta: ang mga pinakamaraming sumasakay sa Aguinaldo Hwy, Molino Blvd at Bacoor Blvd.

## 10. Repo structure

```
dadaan-ba/
├── app/                 # Flutter app
│   ├── lib/
│   │   ├── scan/        # camera + OCR
│   │   ├── match/       # fuzzy matcher (+ unit tests)
│   │   ├── routes/      # route detail, mapa
│   │   └── search/      # manual search, "dadaan ba sa ___?"
│   └── test/
├── data/
│   ├── routes/          # isang JSON bawat ruta
│   ├── paths/           # GeoJSON lines
│   └── landmarks.json
├── tools/validate_data.dart
├── test/plakard_photos/
├── docs/CONTRIBUTING_ROUTES.md   # paano mag-ambag ng ruta (kahit hindi coder)
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE              # MIT (code)
└── data/LICENSE         # ODbL (data, compatible sa OpenStreetMap)
```

## 11. Open source setup

- **License:** MIT sa code; **ODbL** sa route data (para compatible sa OSM at manatiling open ang data).
- **Contribution paths:**
  - *Non-coder:* GitHub issue template na "Bagong ruta / Mali ang ruta" (plakard photo + dinadaanan).
  - *Data contributor:* PR ng isang JSON + GeoJSON file.
  - *Developer:* issues na may label na `good first issue`, `help wanted`.
- **Issue templates:** Bug, Bagong ruta, Maling ruta, Feature request.
- **Docs sa Taglish at English** — para abot ang local contributors.
- **Releases:** semantic versioning, `CHANGELOG.md`, APK na naka-attach sa GitHub Release.

## 12. Launch plan

1. **Pre-launch:** 10 verified ruta, 30-second demo video (scan → sagot) na kinunan sa totoong terminal.
2. **Launch channels:**
   - Facebook groups: Imus at Bacoor community groups, commuter groups sa Cavite
   - Reddit: r/Philippines, r/Cavite, r/FlutterDev
   - Dev communities: Flutter Philippines, dev.to post na "Paano ko ginawa"
3. **Hikayatin ang ambag:** "Hindi mo makita ang jeep mo? I-report mo dito" sa app at sa bawat post.
4. **Mga susukatin:** downloads, bilang ng route reports, match accuracy, GitHub stars at contributors.

## 13. Mga risk at sagot

| Risk | Epekto | Sagot |
|---|---|---|
| Hindi mabasa ng OCR ang hand-painted o stylized na plakard | Mataas | Closed-list fuzzy match + top-3 picker + manual search. **I-test agad sa linggo 1.** |
| Kulang o luma ang route data | Mataas | Magsimula sa maliit pero verified; `verified_on` field; madaling report form |
| Nagbabago ang ruta (rerouting, bagong kalsada) | Katamtaman | Community reports; ipakita ang "huling na-verify" sa app |
| Mabagal mag-scan sa murang phone | Katamtaman | ML Kit on-device; i-test sa low-end Android |
| Walang contributors | Katamtaman | Gawing napakadali ang non-coder contribution; ikaw muna ang core mapper |
| Copyright o franchise data issues | Mababa | Sariling field data at OSM lang; walang kinokopya mula sa ibang app |

## 14. Unang 4 na linggo

| Linggo | Gagawin |
|---|---|
| **1** | Kunan ng litrato ang 30+ plakard. Gumawa ng OCR + fuzzy-match prototype (Dart script). Sukatin ang accuracy. **Go / no-go dito.** |
| **2** | Data format + validator; 10 ruta na may landmarks at GeoJSON path. Flutter skeleton: camera → resulta. |
| **3** | Route detail screen + mapa, manual search, "Dadaan ba sa ___?" |
| **4** | Polish, README, CONTRIBUTING, issue templates, CI, APK build. Ipa-test sa 5 kakilala. Release v0.1. |

---

**Susunod na hakbang:** linggo 1 — mga litrato ng plakard + matcher prototype.
