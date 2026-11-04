# Dadaan Ba?

**I-scan ang plakard ng jeep at malalaman mo kung saan ito dadaan, at kung dadaan ba sa pupuntahan mo.**

Open-source na web app para sa mga commuter sa **Imus at Bacoor, Cavite**. Sa plakard, ang nakasulat lang ay ang dulo ng ruta, hindi ang mga dinadaanan. Dito pumapasok ang app na ito.

## Paano gumagana

1. **Scan.** Kunan ng litrato ang plakard. Pinapalinaw muna ang litrato (grayscale at contrast stretch, at sinusubukan din ang baligtad na kulay para sa maliwanag na letra sa madilim na board). Pagkatapos, babasahin ito sa phone mismo gamit ang [Tesseract.js](https://github.com/naptha/tesseract.js), kaya walang ina-upload na litrato.
2. **Match.** Ikukumpara ang nabasang text sa listahan ng kilalang plakard gamit ang fuzzy matching. Tatama pa rin ito kahit magulo ang basa, gaya ng `SM M0LIN0 TREC`. Kapag hindi sigurado ang app, ipapakita nito ang top 3.
3. **Sagot.** Lalabas ang ruta sa mapa, ang mga madadaanang landmark, at ang sagot sa "Dadaan ba sa ___?"

May baligtad na mode din, ang **"Saan ako sasakay?"**: piliin kung saan ka pupunta, at ipapakita ng app ang mga plakard na hahanapin mo.

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

Galing sa **[OpenStreetMap](https://www.openstreetmap.org)** ang mga ruta. Binubuo ng [`app/tools/build_routes.py`](app/tools/build_routes.py) ang `app/src/routes.json` mula sa mga OSM extract sa `app/tools/osm/`. Itinuturing na madadaanan ang isang landmark kapag nasa loob ito ng 200 m ng daan.

```bash
python app/tools/build_routes.py
```

Kasalukuyang saklaw (9 na ruta): SM Bacoor–SM Molino, Imus–GMA, Zapote–Silang, PITX–Dasma, SM Molino–WalterMart Dasma, SM Molino–Trece, District Imus–District Dasma, Vista Mall Imus–NOMO, at Binakayan–Zapote.

> ⚠️ Hindi pa nakukumpirma sa kalsada ang eksaktong pagkakasulat sa plakard. Kulang pa rin ang mga lumang ruta mula Zapote at SM Bacoor papuntang Imus, Kawit, Noveleta at Tanza. Tingnan ang [CONTRIBUTING.md](CONTRIBUTING.md) kung paano tumulong.

## Tumulong

Hindi mo kailangang marunong mag-code. Ang pinakamalaking tulong ay **litrato ng plakard** at **tamang ruta**. Basahin ang [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

Nasa [PLAN.md](PLAN.md) ang buong plano, kasama ang data status at mga risk.

## License

- Code: [MIT](LICENSE)
- Route data: © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/)
