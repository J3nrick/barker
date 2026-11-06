"""Builds src/routes.json from OpenStreetMap extracts in tools/osm/.

Run: python tools/build_routes.py
Refresh the extracts first with: python tools/fetch_osm.py
"""
import hashlib
import json
import math
import re
from pathlib import Path

HERE = Path(__file__).parent
FETCHED = "2026-11-05"

# OSM relation ids -> signboard (plakard) text. The route itself (path, operator) comes from OSM;
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
    {"osm": [3316644], "plakard": "ZAPOTE - ALABANG", "aliases": ["ALABANG - ZAPOTE"], "kind": "jeep"},
    {"osm": [10463094], "plakard": "SM MOLINO - ALABANG", "aliases": ["ALABANG - SM MOLINO", "MOLINO - ALABANG"], "kind": "jeep"},
    {"osm": [9266696], "plakard": "TANZA - PITX", "aliases": ["PITX - TANZA"], "kind": "jeep"},
    {"osm": [3315911], "plakard": "LANCASTER - PATINDIG ARAW", "aliases": ["PATINDIG ARAW - LANCASTER", "LANCASTER - IMUS"], "kind": "jeep"},
    {"osm": [10511881], "plakard": "SOMO - ALLHOME KAWIT", "aliases": ["ALLHOME KAWIT - SOMO", "SOMO - KAWIT"], "kind": "modern"},
    {"osm": [10511882], "plakard": "SOMO - VISTA MALL GENTRI", "aliases": ["VISTA MALL GENTRI - SOMO", "SOMO - GENTRI"], "kind": "modern"},
    {"osm": [17649803], "plakard": "CAVITE CITY - ZAPOTE", "aliases": ["ZAPOTE - CAVITE CITY"], "kind": "modern"},
    # City buses: the board shows both ends; the route number is painted on the side.
    {"osm": [9035426], "plakard": "CAVITE CITY - PITX", "aliases": ["PITX - CAVITE CITY"], "kind": "bus"},
    {"osm": [8087588], "plakard": "DASMARIÑAS - PITX", "aliases": ["PITX - DASMARIÑAS"], "kind": "bus"},
    {"osm": [9353211], "plakard": "NAIC - PITX", "aliases": ["PITX - NAIC"], "kind": "bus"},
    {"osm": [8682107], "plakard": "SILANG - PITX", "aliases": ["PITX - SILANG"], "kind": "bus"},
    {"osm": [3968379], "plakard": "TRECE MARTIRES - PITX", "aliases": ["PITX - TRECE", "TRECE - PITX"], "kind": "bus"},
    {"osm": [8682736], "plakard": "GMA - PITX", "aliases": ["PITX - GMA"], "kind": "bus"},
    {"osm": [15071496], "plakard": "LANCASTER - PITX", "aliases": ["PITX - LANCASTER"], "kind": "bus"},
    {"osm": [9336839], "plakard": "IMUS - MAKATI", "aliases": ["DISTRICT IMUS - ONE AYALA", "MAKATI - IMUS"], "kind": "p2p"},
    {"osm": [5456751], "plakard": "NOMO - MAKATI", "aliases": ["MAKATI - NOMO", "BACOOR - MAKATI"], "kind": "p2p"},
    {"osm": [8676820], "plakard": "SOMO - MAKATI", "aliases": ["MAKATI - SOMO"], "kind": "p2p"},
    {"osm": [8026513], "plakard": "SOMO - ALABANG", "aliases": ["ALABANG - SOMO", "BACOOR - ALABANG"], "kind": "p2p"},
    {"osm": [18307719], "plakard": "IMUS - NAIA", "aliases": ["UBE EXPRESS IMUS", "NAIA - IMUS"], "kind": "p2p"},
    {"osm": [11246107], "plakard": "BACOOR - PITX", "aliases": ["PITX - BACOOR", "MOLINO - PITX"], "kind": "uv"},
    {"osm": [11262468], "plakard": "MOLINO - LAWTON", "aliases": ["LAWTON - MOLINO"], "kind": "uv"},
    {"osm": [11262469], "plakard": "SPRINGVILLE - ALABANG", "aliases": ["ALABANG - SPRINGVILLE"], "kind": "uv"},
    {"osm": [11045873], "plakard": "SPRINGVILLE - AYALA", "aliases": ["AYALA - SPRINGVILLE"], "kind": "uv"},
    {"osm": [10463123], "plakard": "ALABANG - IMUS", "aliases": ["IMUS - ALABANG", "ALABANG - IMUS TOLL BRIDGE"], "kind": "uv"},
]

# OSM name -> name commuters actually say. Only these become stops along a route.
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
# Stop names from route relations that mean the same place as a landmark above.
LANDMARKS.update({
    "SM City Bacoor": "SM Bacoor", "SoMo Departures": "SoMo (Molino)", "NoMo": "NOMO",
    "The District Imus P2P Terminal": "The District Imus", "PITX LRT Station": "PITX",
    "Parañaque Integrated Terminal Exchange": "PITX", "Zapote": "Zapote", "Zapote Kabila": "Zapote",
    "Kawit Municipal Hall": "Kawit Town Hall", "Imus City Transport Terminal": "Imus Transport Plaza",
    "Robinsons Imus": "Robinsons Imus", "Robinsons Imus Transport Terminal": "Robinsons Imus",
    "Robinsons Place Imus 2": "Robinsons Imus",
    # Far ends: commuters name the city or hub, not the exact stop.
    "PITX Main Building": "PITX",
    "Alabang Town Center": "Alabang", "Alabang Town Center UV Express Terminal": "Alabang",
    "Alabang Town Center P2P Bus Station": "Alabang", "South Station": "Alabang",
    "Circuit Makati": "Makati", "Paseo de Roxas": "Makati", "Landmark": "Makati", "Trasierra": "Makati",
    "Park Square": "Makati", "Circuit Makati Transport Terminal": "Makati",
    "Park & Ride Lawton": "Lawton", "Park N' Ride Lawton": "Lawton",
})
NEAR_M = {"landmark": 200, "stop": 60, "terminal": 150}  # how close a route must pass for a place to count as on the route
GENERIC_WORDS = {"UV", "Express", "Terminal", "Jeepney", "Bus", "City", "South", "North", "Bound", "Station", "Transport"}  # "UV Express Terminal" says nothing about where
RANK = {"landmark": 0, "stop": 1, "terminal": 2}
KIND_CODE = {"landmark": "l", "stop": "s", "terminal": "t"}


def dist_m(a, b):
    dlat = math.radians(b[0] - a[0])
    dlng = math.radians(b[1] - a[1]) * math.cos(math.radians(a[0]))
    return 6371000 * math.hypot(dlat, dlng)


def thin(seg, min_m=40):
    """Drop points closer than min_m to the last kept one; the map looks the same at street zoom."""
    kept = [seg[0]]
    for q in seg[1:-1]:
        if dist_m(kept[-1], q) >= min_m:
            kept.append(q)
    return kept + seg[-1:] if len(seg) > 1 else kept


def orient(segs):
    """OSM lists a route's ways in order but not each way's direction; flip ways so each starts where the last ended."""
    if len(segs) < 2:
        return segs
    nxt = segs[1]
    first = segs[0] if min(dist_m(segs[0][-1], nxt[0]), dist_m(segs[0][-1], nxt[-1])) <= min(dist_m(segs[0][0], nxt[0]), dist_m(segs[0][0], nxt[-1])) else segs[0][::-1]
    out = [first]
    for seg in segs[1:]:
        end = out[-1][-1]
        out.append(seg if dist_m(end, seg[0]) <= dist_m(end, seg[-1]) else seg[::-1])
    return out


def every(interval):
    """OSM interval tag ("10" minutes or "hh:mm") -> minutes between rides, or None."""
    nums = [int(x) for x in re.findall(r"\d+", (interval or "").split(";")[0])]
    if not nums:
        return None
    return (nums[0] * 60 + nums[1] if ":" in interval and len(nums) > 1 else nums[0]) or None


def poi_point(e):
    return (e["lat"], e["lon"]) if "lat" in e else (e["center"]["lat"], e["center"]["lon"])


def load_places():
    """name -> {kind, pts}. Landmarks are curated; stops and terminals come straight from OSM."""
    places = {}

    def add(name, kind, pt):
        p = places.setdefault(name, {"kind": kind, "pts": []})
        p["pts"].append(pt)
        if RANK[kind] > RANK[p["kind"]]:
            p["kind"] = kind

    for e in json.loads((HERE / "osm/poi.json").read_text("utf-8"))["elements"]:
        t = e.get("tags", {})
        name = t.get("name")
        # Jeep/bus/UV terminals only; tricycle stands and train or ferry stations are not where these routes load.
        terminal = t.get("amenity") in ("bus_station", "fx_station") and not any(w in (name or "") for w in ("Tricycle", "TODA"))
        if name in LANDMARKS:
            add(LANDMARKS[name], "terminal" if terminal else "landmark", poi_point(e))
        elif terminal and name and set(name.replace("&", " ").split()) - GENERIC_WORDS:
            add(name, "terminal", poi_point(e))
    missing = {v for k, v in LANDMARKS.items()} - set(places)
    stop_names = set()
    for e in json.loads((HERE / "osm/stops.json").read_text("utf-8"))["elements"]:
        name = LANDMARKS.get(e["tags"]["name"], e["tags"]["name"])
        stop_names.add(name)
        add(name, "terminal" if "Terminal" in e["tags"]["name"] else "stop", (e["lat"], e["lon"]))
    missing -= stop_names
    assert not missing, f"landmarks not found in OSM extract: {missing}"
    return places


def load_local():
    """Terminals and tricycle/pedicab stands in Imus and Bacoor: [{name, lat, lng, t}], t = "trike" | "terminal"."""
    out = []
    for e in json.loads((HERE / "osm/local.json").read_text("utf-8"))["elements"]:
        t = e.get("tags", {})
        name = t.get("name") or ""
        trike = t.get("amenity") in ("taxi", "tricycle_terminal") or re.search(r"tricycle|toda|pedicab", name, re.I)
        if not trike and t.get("amenity") not in ("bus_station", "fx_station"):
            continue  # e.g. "Strike Gymnasium" matched the name search
        lat, lng = (round(x, 5) for x in poi_point(e))
        name = LANDMARKS.get(name, name) or ("Pedicab stand" if "pedicab" in (t.get("operator") or "").lower() else "Tricycle terminal")
        # One OSM feature is often mapped twice (a node and an area); keep the first.
        if any(o["name"] == name and dist_m((o["lat"], o["lng"]), (lat, lng)) < 150 for o in out):
            continue
        out.append({"name": name, "lat": lat, "lng": lng, "t": "trike" if trike else "terminal"})
    return out


def main():
    rels = {e["id"]: e for e in json.loads((HERE / "osm/geom.json").read_text("utf-8"))["elements"]}
    stop_tags = {e["id"]: e["tags"]["name"] for e in json.loads((HERE / "osm/stops.json").read_text("utf-8"))["elements"]}
    places = load_places()

    out = []
    for cfg in ROUTES:
        rel = rels[cfg["osm"][0]]
        segs = [thin([(round(p["lat"], 5), round(p["lon"], 5)) for p in m["geometry"]])
                for m in rel["members"] if m["type"] == "way" and m.get("role", "") == "" and "geometry" in m]
        segs = orient(segs)
        pts = [p for s in segs for p in s]
        # Distance along the route at each point, for fares; a jump between unconnected OSM ways adds nothing.
        along = [0.0]
        for a, b in zip(pts, pts[1:]):
            step = dist_m(a, b)
            along.append(along[-1] + (step if step < 1000 else 0))
        assert pts, f"relation {rel['id']} has no geometry"
        own = {LANDMARKS.get(stop_tags[m["ref"]], stop_tags[m["ref"]])
               for m in rel["members"] if m["type"] == "node" and m["ref"] in stop_tags}
        lo = (min(p[0] for p in pts) - 0.003, min(p[1] for p in pts) - 0.003)
        hi = (max(p[0] for p in pts) + 0.003, max(p[1] for p in pts) + 0.003)

        via = []
        for name, place in places.items():
            near = [q for q in place["pts"] if lo[0] <= q[0] <= hi[0] and lo[1] <= q[1] <= hi[1]]
            # Limited-stop rides (P2P) only count their own stops; the rest stop wherever you flag them.
            if not near or (cfg["kind"] == "p2p" and name not in own):
                continue
            i, d, pos = min(((i, dist_m(q, p), q) for q in near for i, p in enumerate(pts)), key=lambda x: x[1])
            if d <= NEAR_M[place["kind"]] or (name in own and d <= 300):
                via.append((i, {"name": name, "lat": round(pos[0], 5), "lng": round(pos[1], 5), "k": KIND_CODE[place["kind"]], "km": round(along[i] / 1000, 2)}))
        via.sort(key=lambda x: x[0])
        tags = rel["tags"]
        out.append({
            "id": cfg["plakard"].lower().replace(" - ", "-").replace(" ", "-").replace("ñ", "n"),
            "plakard": cfg["plakard"],
            "aliases": cfg["aliases"],
            "kind": cfg["kind"],
            "loop": "loop" in tags.get("name", "").lower() or None,  # one-way loops have no "toward" end
            "ref": tags.get("ref") if cfg["kind"] in ("bus", "p2p") else None,
            "operator": (tags.get("operator") or "").split(";")[0] or None,
            "roads": [r for r in (tags.get("via") or "").split(";") if r],
            "every": every(tags.get("interval")),
            "via": [v for _, v in via],
            "path": segs,
            "osm": cfg["osm"][0],
        })
        print(f"{cfg['plakard']:32} {len(pts):5} pts  {len(via):3} via")

    ids = [r["id"] for r in out]
    assert len(ids) == len(set(ids)), "duplicate route ids"
    # Paths are most of the bytes and only needed on the map, so they ship as a separate file the map fetches.
    # The name carries a content hash so a cached copy never outlives a data update.
    paths = json.dumps({r["id"]: r.pop("path") for r in out}, separators=(",", ":"))
    name = f"paths.{hashlib.sha1(paths.encode()).hexdigest()[:8]}.json"
    public = HERE.parent / "public"
    for old in public.glob("paths.*.json"):
        old.unlink()
    (public / name).write_text(paths, "utf-8")
    meta = {"source": "OpenStreetMap contributors (ODbL)", "fetched": FETCHED, "paths": name}
    data = {"meta": meta, "routes": out, "sakayan": load_local()}
    (HERE.parent / "src/routes.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), "utf-8")


if __name__ == "__main__":
    main()
