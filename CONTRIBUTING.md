# Paano tumulong

Salamat! Ito ang mga paraan, mula pinakamadali:

## 1. Magpadala ng litrato ng plakard (walang code)

Mag-open ng issue gamit ang template na **"Litrato ng plakard"**. Ilakip ang litrato at isulat:
- kung saan mo ito kinunan (terminal o kalsada), at
- ang eksaktong nakasulat sa plakard.

Ginagamit namin ang mga litratong ito para i-test ang scanner at itama ang pagkakasulat ng plakard sa data.

## 2. Mag-report ng bago o maling ruta (walang code)

Gamitin ang template na **"Bagong ruta"** o **"Maling ruta"**. Isulat ang plakard, ang mga dinadaanan sa pagkakasunod-sunod, at kung kailan mo huling nasakyan.

## 2b. Magdagdag ng sakayan (walang code)

Sa app, buksan ang **Mga sakayan**, pindutin ang **+ Magdagdag ng sakayan**, i-pin ang lugar sa mapa, at i-save. Makikita mo agad ito sa phone mo. Pindutin ang **Ipadala sa GitHub** para mabuksan ang template na **"Bagong sakayan"** na may laman na. Ilalagay ito ng maintainer sa OpenStreetMap (`amenity=taxi` para sa tricycle, `amenity=bus_station` para sa terminal), kaya lalabas ito para sa lahat sa susunod na `fetch_osm.py`.

## 3. I-mapa ang ruta sa OpenStreetMap

Galing sa OpenStreetMap ang data namin, kaya kapag inayos mo ang ruta doon, makikinabang ang lahat ng app.
1. Gumawa ng ruta bilang `type=route` + `route=share_taxi` (jeep) relation. Sundan ang [PH public transport guide](https://wiki.openstreetmap.org/wiki/Philippines/Public_transport).
2. Idagdag ang relation id sa `ROUTES` sa [`app/tools/build_routes.py`](app/tools/build_routes.py), kasama ang plakard text.
3. Patakbuhin ang `python app/tools/fetch_osm.py`, tapos ang `python app/tools/build_routes.py`.
4. Mag-PR.

## 4. Code

```bash
cd app && npm install && npm run dev
```

Bago mag-PR, siguraduhing pasado ang `npm run check`, `npm run lint` at `npm run build`. Kapag binago mo ang `src/matcher.js`, magdagdag ng kaso sa `src/matcher.check.js`.

## Mga patakaran

- Maging magalang. Bawal ang panlalait at harassment.
- Walang kinokopyang data mula sa ibang app na hindi open. Sariling obserbasyon at OpenStreetMap lang ang tinatanggap.
- Puwedeng gumamit ng Filipino o English.
