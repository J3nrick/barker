"""Builds src/routes.json from OpenStreetMap extracts in tools/osm/.

Run: python tools/build_routes.py
Refresh the extracts with the Overpass queries at the bottom of this file.
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).parent
FETCHED = "2026-11-04"

# OSM relation ids -> plakard text. The route itself (path, operator) comes from OSM;
# the plakard wording is our best guess from the OSM from/to tags and still needs a photo to confirm.
ROUTES = [
    {"osm": [17922478, 17934695], "plakard": "SM BACOOR - SM MOLINO", "aliases": ["SM MOLINO - SM BACOOR", "BACOOR - MOLINO VIA MAMBOG"], "kind": "jeep"},
    {"osm": [10092672, 10150609], "plakard": "IMUS - GMA", "aliases": ["GMA - IMUS", "IMUS - PALIPARAN - GMA", "IMUS - PALAPALA"], "kind": "jeep"},
    {"osm": [10141458], "plakard": "ZAPOTE - SILANG", "aliases": ["SILANG - ZAPOTE", "BACOOR - SILANG"], "kind": "modern"},
    {"osm": [10018379], "plakard": "PITX - DASMA", "aliases": ["DASMA - PITX", "PITX - DASMARIÑAS"], "kind": "jeep"},
    {"osm": [10316636], "plakard": "SM MOLINO - WALTERMART DASMA", "aliases": ["WALTERMART DASMA - SM MOLINO"], "kind": "jeep"},
    {"osm": [8853767], "plakard": "SM MOLINO - TRECE", "aliases": ["TRECE - SM MOLINO", "SM MOLINO - WALTERMART TRECE"], "kind": "jeep"},
    {"osm": [10600896], "plakard": "DISTRICT IMUS - DISTRICT DASMA", "aliases": ["DISTRICT DASMA - DISTRICT IMUS"], "kind": "jeep"},
    {"osm": [14196973], "plakard": "VISTA MALL IMUS - NOMO", "aliases": ["NOMO - VISTA MALL IMUS"], "kind": "modern"},
    {"osm": [18185851], "plakard": "BINAKAYAN - ZAPOTE", "aliases": ["ZAPOTE - BINAKAYAN"], "kind": "jeep"},
]

# OSM name -> name commuters actually say. Only these become "dinadaanan" stops.
LANDMARKS = {
    "SM City Bacoor": "SM Bacoor",
    "SM City Molino": "SM Molino",
    "Bacoor City Hall Main Building": "Bacoor City Hall",
    "WalterMart Bacoor": "WalterMart Bacoor",
    "SM Bacoor Transport Terminal": "SM Bacoor",
    "SM Molino Transport Terminal": "SM Molino",
    "Robinsons Place Imus Transport Terminal": "Robinsons Imus",
    "Zapote Terminal": "Zapote",
    "Zapote Barangay Hall": "Zapote",
    "Cavite State University – Bacoor City Campus": "CvSU Bacoor",
    "University of Perpetual Help System Dalta Molino Campus": "Perpetual Molino",
    "St. Dominic College of Asia": "St. Dominic College",
    "Vista Mall Daang Hari Terminal": "Vista Mall Daang Hari",
    "SoMo": "SoMo (Molino)",
    "The District Imus": "The District Imus",
    "Robinsons Place Imus": "Robinsons Imus",
    "SM Center Imus": "SM Center Imus",
    "Imus Cathedral": "Imus Cathedral (Bayan)",
    "New Imus City Hall": "Imus City Hall",
    "Imus Transport Plaza": "Imus Transport Plaza",
    "Vista Mall Imus": "Vista Mall Imus",
    "NOMO": "NOMO",
    "Cavite State University Imus Campus": "CvSU Imus",
    "Medical Center Imus": "Medical Center Imus",
    "De La Salle Medical and Health Sciences Institute": "De La Salle Medical (Dasma)",
    "SM City Dasmariñas": "SM Dasmariñas",
    "Robinsons Place Dasmariñas": "Robinsons Dasmariñas",
    "SM City Trece Martires": "SM Trece Martires",
    "Kawit Municipal Hall": "Kawit Town Hall",
    "Binakayan Hospital and Medical Center": "Binakayan",
}
NEAR_M = 200  # a landmark counts as "dinadaanan" if the route passes within this distance


def dist_m(a, b):
    dlat = math.radians(b[0] - a[0])
    dlng = math.radians(b[1] - a[1]) * math.cos(math.radians(a[0]))
    return 6371000 * math.hypot(dlat, dlng)


def thin(seg, min_m=25):
    """Drop points closer than min_m to the last kept one; the map looks the same at street zoom."""
    kept = [seg[0]]
    for q in seg[1:-1]:
        if dist_m(kept[-1], q) >= min_m:
            kept.append(q)
    return kept + seg[-1:] if len(seg) > 1 else kept


def poi_point(e):
    return (e["lat"], e["lon"]) if "lat" in e else (e["center"]["lat"], e["center"]["lon"])


def main():
    rels = {e["id"]: e for e in json.loads((HERE / "osm/geom.json").read_text("utf-8"))["elements"]}
    pois = {}
    for e in json.loads((HERE / "osm/poi.json").read_text("utf-8"))["elements"]:
        name = e.get("tags", {}).get("name")
        if name in LANDMARKS:  # a landmark may have several points (mall + its terminal)
            pois.setdefault(LANDMARKS[name], []).append(poi_point(e))
    missing = set(LANDMARKS.values()) - set(pois)
    assert not missing, f"landmarks not found in OSM extract: {missing}"

    out = []
    for cfg in ROUTES:
        rel = rels[cfg["osm"][0]]
        segs = [[(round(p["lat"], 5), round(p["lon"], 5)) for p in m["geometry"]]
                for m in rel["members"] if m["type"] == "way" and m.get("role", "") == "" and "geometry" in m]
        pts = [p for s in segs for p in s]
        assert pts, f"relation {rel['id']} has no geometry"

        via = []
        for name, positions in pois.items():
            i, d, pos = min(((i, dist_m(pos, p), pos) for pos in positions for i, p in enumerate(pts)), key=lambda x: x[1])
            if d <= NEAR_M:
                via.append((i, {"name": name, "lat": pos[0], "lng": pos[1]}))
        via.sort(key=lambda x: x[0])
        tags = rel["tags"]
        out.append({
            "id": cfg["plakard"].lower().replace(" - ", "-").replace(" ", "-"),
            "plakard": cfg["plakard"],
            "aliases": cfg["aliases"],
            "kind": cfg["kind"],
            "operator": (tags.get("operator") or "").split(";")[0] or None,
            "roads": [r for r in (tags.get("via") or "").split(";") if r],
            "via": [v for _, v in via],
            "path": [thin(s) for s in segs],
            "osm": cfg["osm"][0],
        })
        print(f"{cfg['plakard']:32} {len(pts):5} pts  via: {', '.join(v['name'] for _, v in via) or '-'}")

    data = {"meta": {"source": "OpenStreetMap contributors (ODbL)", "fetched": FETCHED}, "routes": out}
    (HERE.parent / "src/routes.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), "utf-8")


if __name__ == "__main__":
    main()

# Overpass queries used for tools/osm/ (run at https://overpass-turbo.eu):
# geom.json: [out:json];rel(id:8853767,10150609,10092672,10316636,10600896,17922478,17934695,18185851,14196973,10018379,10141458);out geom;
# poi.json:  [out:json];(nwr["shop"="mall"](14.20,120.80,14.55,121.05);nwr["amenity"~"townhall|bus_station|university|college|hospital"]["name"](14.33,120.88,14.47,121.0);nwr["amenity"="place_of_worship"]["name"~"Cathedral|Parish"](14.38,120.92,14.46,120.96););out center tags;
