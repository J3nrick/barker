# Dadaan Ba?

**Itanong kung saan ang sakayan papunta sa pupuntahan mo, o i-scan ang plakard ng jeep, bus o UV para malaman kung saan ito dadaan.**

Open-source na web app para sa mga commuter sa **Imus at Bacoor, Cavite**. Sa plakard, ang nakasulat lang ay ang dulo ng ruta, hindi ang mga dinadaanan. Kapag hindi ka pamilyar sa lugar, hindi mo rin alam kung saan ka sasakay. Dito pumapasok ang app na ito.

## Paano gumagana

May tatlong paraan:

- **Itanong** (boses o type): "Saan ang sakayan papuntang PITX?" Ililista ng app ang mga jeep, modern jeep, UV Express, bus at P2P na dadaan doon, pati kung saan sasakay. Kapag pinayagan mo ang lokasyon, ipapakita nito ang pinakamalapit na sakayan sa iyo. Binabasa rin nito nang malakas ang sagot. Gumagamit ito ng Web Speech API ng browser (pinakamaayos sa Chrome sa Android).
- **Mga sakayan**: mapa at listahan ng mga terminal ng jeep, UV at bus, at ng 49 na paradahan ng tricycle at pedicab sa Imus at Bacoor. Kapag pinayagan ang lokasyon, nauuna ang pinakamalapit sa iyo at may link ng direksyon papunta roon. Puwede ka ring **magdagdag ng sakayan** na kulang: i-pin ito sa mapa at i-save sa phone mo, tapos ipadala sa GitHub para maidagdag para sa lahat.
- **I-scan**: kunan ng litrato ang plakard.

Ganito gumagana ang scan:

1. **Scan.** Kunan ng litrato ang plakard. Pinapalinaw muna ang litrato (grayscale at contrast stretch, at sinusubukan din ang baligtad na kulay para sa maliwanag na letra sa madilim na board). Pagkatapos, babasahin ito sa phone mismo gamit ang [Tesseract.js](https://github.com/naptha/tesseract.js), kaya walang ina-upload na litrato.
2. **Match.** Ikukumpara ang nabasang text sa listahan ng kilalang plakard gamit ang fuzzy matching. Tatama pa rin ito kahit magulo ang basa, gaya ng `SM M0LIN0 TREC`. Kapag hindi sigurado ang app, ipapakita nito ang top 3.
3. **Sagot.** Lalabas ang ruta sa mapa, ang mga madadaanang landmark, at ang sagot sa "Dadaan ba sa ___?"

Puwede itong i-install sa home screen (PWA). Pagkatapos ng unang gamit, naka-cache na ang app, ang OCR engine at ang mga nakitang bahagi ng mapa, kaya gagana na ito kahit mahina ang signal.

**Live:** https://dadaan-ba.vercel.app (mirror: https://j3nrick.github.io/dadaan-ba/)

## Patakbuhin

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run check    # self-check ng plakard matcher
npm run lint
npm run build
```

## Route data

Galing sa **[OpenStreetMap](https://www.openstreetmap.org)** ang mga ruta. Kinukuha ng [`app/tools/fetch_osm.py`](app/tools/fetch_osm.py) ang mga OSM extract papunta sa `app/tools/osm/`, at mula roon binubuo ng [`app/tools/build_routes.py`](app/tools/build_routes.py) ang `app/src/routes.json`. Itinuturing na madadaanan ang isang lugar kapag dumaan ang ruta sa loob ng 200 m ng landmark, 150 m ng terminal, o 60 m ng stop. Sa P2P, ang sarili lang nitong mga stop ang binibilang.

```bash
python app/tools/fetch_osm.py    # i-refresh ang OSM data (mabagal kapag busy ang Overpass)
python app/tools/build_routes.py
```

Kasalukuyang saklaw (33 ruta na dumadaan sa Imus o Bacoor):

- **Jeep (11):** SM Bacoor–SM Molino, Imus–GMA, PITX–Dasma, SM Molino–WalterMart Dasma, SM Molino–Trece, District Imus–District Dasma, Binakayan–Zapote, Zapote–Alabang, SM Molino–Alabang, Tanza–PITX, Lancaster–Patindig Araw
- **Modern jeep (5):** Zapote–Silang, Vista Mall Imus–NOMO, SoMo–AllHome Kawit, SoMo–Vista Mall GenTri, Cavite City–Zapote
- **UV Express (5):** Bacoor–PITX, Molino–Lawton, Springville–Alabang, Springville–Ayala, Alabang–Imus
- **Bus (7):** Routes 26, 27, 28, 29, 31, 32 at 55 papuntang PITX
- **P2P (5):** Imus–Makati, NoMo–Makati, SoMo–Makati, SoMo–Alabang, Imus–NAIA

> ⚠️ Hindi pa nakukumpirma sa kalsada ang eksaktong pagkakasulat sa plakard. Kulang pa rin ang mga lumang ruta mula Zapote at SM Bacoor papuntang Imus, Kawit, Noveleta at Tanza. Tingnan ang [CONTRIBUTING.md](CONTRIBUTING.md) kung paano tumulong.

## Tumulong

Hindi mo kailangang marunong mag-code. Ang pinakamalaking tulong ay **litrato ng plakard**, **tamang ruta**, at **mga sakayan na kulang** (puwede mo itong idagdag mula mismo sa app, sa tab na Mga sakayan). Basahin ang [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

Nasa [PLAN.md](PLAN.md) ang buong plano, kasama ang data status at mga risk.

## License

- Code: [MIT](LICENSE)
- Route data: © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/)
