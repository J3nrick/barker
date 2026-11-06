"""Builds the Metro Manila region from OpenStreetMap extracts in tools/osm/manila/.

Unlike Cavite (a hand-picked list), Metro Manila has hundreds of routes, so they're picked by rules:
jeeps, city buses, UV Express, P2P, city-run buses and the LRT/MRT; provincial buses, suspended lines and
private shuttles are left out, and the two directions of a route become one.

Run: python tools/fetch_osm.py manila && python tools/build_manila.py
"""
import json
import re
from pathlib import Path

from build_routes import dist_m, every, orient, poi_point, thin, write_region

HERE = Path(__file__).parent
OSM = HERE / "osm" / "manila"
FETCHED = "2026-11-06"
BBOX = (14.40, 120.93, 14.78, 121.13)  # south, west, north, east: Metro Manila
RAIL = {"light_rail", "subway", "train", "monorail"}
# Not ridable today, or not a Metro Manila commuter ride.
SKIP = ("Interregional", "Inter-Regional", "Region III", "Region IV-A", "Victory Liner", "Medical", "Metro Manila Subway",
        "PNR", "Love Bus", "Solaire", "Shuttle", "Celyrosa")
# City-run and private networks with their own (often free) fares, so the LTFRB estimate doesn't apply.
OWN_FARE = ("QCityBus", "Quezon City Bus", "BGC Bus", "Pasig Transport", "Citylink")
LANDMARK = {"mall", "university", "college", "hospital", "townhall"}
# Several OSM names for one place people call by one name.
SAME = {"Parañaque Integrated Terminal Exchange": "PITX", "PITX Main Building": "PITX", "PITX Terminal": "PITX",
        "Yamaha Monumento": "Monumento"}  # stations renamed for sponsors keep the name riders use
NEAR_M = {"l": 200, "t": 150, "s": 60}
CELL = 0.002  # ~220 m grid for finding which places a route passes


def kind_of(t):
    """OSM route tags -> jeep | modern | uv | bus | p2p | rail, or None to leave it out."""
    net, name, route = t.get("network", ""), t.get("name", ""), t.get("route")
    if not name or any(s in net or s in name for s in SKIP):
        return None
    if route in RAIL:
        return "rail"
    if "P2P" in net or "P2P" in name:
        return "p2p"
    if "UV" in net or "UV Express" in name or route == "share_taxi":
        return "uv"
    if t.get("bus") == "share_taxi" or "PUJ" in net or "Jeepney" in name:
        return "jeep"
    if t.get("bus") == "minibus" or "PUVMP" in net:
        return "modern"
    return "bus"


def ends(t):
    """The two place names a signboard would show, from the route name (or from/to tags)."""
    name = t.get("name", "")
    name = name.split(":", 1)[1] if ":" in name else name  # "Route 23: Alabang–Lawton" -> "Alabang–Lawton"
    name = re.sub(r"\(.*?\)|\bvia\b.*$|\bP2P\b|\bUV Express\b|\bLoop\b", " ", name, flags=re.I)
    parts = [p.strip(" -()") for p in re.split(r"–|—|→|↔| - | to ", name) if p.strip(" -()")]
    if len(parts) >= 2:
        return parts[0], parts[-1]
    if t.get("from") and t.get("to"):
        return t["from"].split(",")[0], t["to"].split(",")[0]
    return None


def pick(rels):
    """Relations to keep, one per route (the direction with the most stops), with kind and ends."""
    best = {}
    for e in rels:
        t = e["tags"]
        kind = kind_of(t)
        pair = ends(t)
        if not kind or not pair:
            continue
        # A train line is one ride whatever its relations are called; other routes are their two ends.
        key = (kind, t.get("ref", "")) if kind == "rail" else (kind, frozenset(p.upper() for p in pair))
        stops = sum(1 for m in e.get("members", []) if m.get("role", "").startswith(("stop", "platform")))
        if key not in best or stops > best[key][0]:
            best[key] = (stops, e, kind, pair)
    return [(e, kind, pair) for _, e, kind, pair in best.values()]


def closed(tags):
    """PNR trains are suspended and the subway isn't open: their stations share names with running ones."""
    owner = f"{tags.get('operator', '')} {tags.get('network', '')}"
    # Unopened Metro Manila Subway stations are often mapped as station=subway with no operator yet.
    return re.search(r"Subway|National Railways|North South Commuter", owner) or (tags.get("station") == "subway" and not owner.strip())


def load_places():
    """[(name, lat, lng, k)] for landmarks (l), terminals and stations (t) in Metro Manila."""
    out = []
    for e in json.loads((OSM / "poi.json").read_text("utf-8"))["elements"]:
        t = e.get("tags", {})
        if not t.get("name"):
            continue
        station = (t.get("railway") == "station" and not closed(t)) or t.get("amenity") == "bus_station"
        # Barangay halls are tagged townhall too; only city and municipal halls are landmarks people ride to.
        hall = t.get("amenity") == "townhall" and not re.search(r"city hall|municipal", t["name"], re.I)
        if station or t.get("shop") == "mall" or (t.get("amenity") in LANDMARK and not hall):
            lat, lng = poi_point(e)
            out.append((SAME.get(t["name"], t["name"]), lat, lng, "t" if station else "l"))
    return out


def load_local():
    """Ride spots: train stations, jeep/bus/UV terminals and tricycle stands."""
    out = []
    for e in json.loads((OSM / "local.json").read_text("utf-8"))["elements"]:
        t = e.get("tags", {})
        name = t.get("name") or ""
        if t.get("railway") == "station":
            if closed(t):
                continue
            kind = "train"
        elif t.get("amenity") in ("taxi", "tricycle_terminal") or re.search(r"tricycle|toda|pedicab", name, re.I):
            kind = "trike"
        elif t.get("amenity") in ("bus_station", "fx_station"):
            kind = "terminal"
        else:
            continue
        lat, lng = (round(x, 5) for x in poi_point(e))
        name = SAME.get(name, name) or ("Tricycle terminal" if kind == "trike" else "Terminal")
        # The same stop is often mapped more than once; a station's entrances and platforms can be 300 m apart.
        if any(o["name"] == name and dist_m((o["lat"], o["lng"]), (lat, lng)) < (400 if kind == "train" else 150) for o in out):
            continue
        out.append({"name": name, "lat": lat, "lng": lng, "t": kind})
    return out


def disambiguate(routes):
    """Chains ("STI College", "WalterMart") share a name across the city. Name each far-apart one after the nearest
    station or terminal ("STI College (near Cubao)") so asking for it doesn't mix up places kilometres apart."""
    spots = {}
    for r in routes:
        for name, lat, lng, k, _ in r["via"]:
            spots.setdefault(name, []).append((lat, lng, k))
    clusters = {}
    for name, pts in spots.items():
        groups = []
        for lat, lng, k in pts:
            g = next((g for g in groups if dist_m(g[0], (lat, lng)) < 1500), None)
            (g if g else groups.append([(lat, lng)]) or groups[-1]).append((lat, lng))
        clusters[name] = groups
    # Train stations are the landmarks everyone knows; other one-place terminals fill gaps.
    stations = {n for r in routes if r["kind"] == "rail" for n, *_ in r["via"]}
    anchors = [(n, g[0][0]) for n, g in clusters.items() if len(g) == 1 and "(" not in n and any(k == "t" for *_, k in spots[n])]
    anchors.sort(key=lambda a: a[0] not in stations)

    def label(name, pos):
        groups = clusters[name]
        if len(groups) == 1:
            return name
        near = min(anchors, key=lambda a: (dist_m(a[1], pos) > 2000 or a[0] not in stations, dist_m(a[1], pos)), default=None)
        return f"{name} (near {near[0]})" if near and dist_m(near[1], pos) < 3000 and near[0] != name else None

    for r in routes:
        renamed = [(label(n, (lat, lng)), lat, lng, k, km) for n, lat, lng, k, km in r["via"]]
        r["via"] = [v for v in renamed if v[0]]


def main():
    rels = json.loads((OSM / "geom.json").read_text("utf-8"))["elements"]
    stops = {e["id"]: e for e in json.loads((OSM / "stops.json").read_text("utf-8"))["elements"]}
    landmarks = load_places()
    out, seen = [], set()
    for rel, kind, (a, b) in pick(rels):
        t = rel["tags"]
        segs = [thin([(round(p["lat"], 5), round(p["lon"], 5)) for p in m["geometry"]], 60)
                for m in rel["members"] if m["type"] == "way" and m.get("role", "") in ("", "forward", "backward") and "geometry" in m]
        segs = orient([s for s in segs if s])
        pts = [p for s in segs for p in s]
        if len(pts) < 2:
            continue
        along = [0.0]
        for p, q in zip(pts, pts[1:]):
            step = dist_m(p, q)
            along.append(along[-1] + (step if step < 1000 else 0))
        grid = {}
        for i, p in enumerate(pts):
            grid.setdefault((int(p[0] / CELL), int(p[1] / CELL)), []).append(i)

        def nearest(lat, lng):
            cx, cy = int(lat / CELL), int(lng / CELL)
            cand = [i for dx in (-1, 0, 1) for dy in (-1, 0, 1) for i in grid.get((cx + dx, cy + dy), ())]
            return min(((i, dist_m((lat, lng), pts[i])) for i in cand), key=lambda x: x[1], default=(None, 1e9))

        via = {}
        own = [stops[m["ref"]] for m in rel["members"] if m["type"] == "node" and m["ref"] in stops]
        for s in own:  # the route's own stops always count
            name = SAME.get(s["tags"]["name"], s["tags"]["name"])
            i, d = nearest(s["lat"], s["lon"])
            if i is not None and d <= 300 and name not in via:
                k = "t" if s["tags"].get("railway") == "station" or "Terminal" in name or s["tags"].get("public_transport") == "station" else "s"
                via[name] = (i, (name, s["lat"], s["lon"], k))
        if kind not in ("p2p", "rail"):  # limited-stop rides only stop at their own stops
            for name, lat, lng, k in landmarks:
                if name in via:
                    continue
                i, d = nearest(lat, lng)
                if i is not None and d <= NEAR_M[k]:
                    via[name] = (i, (name, lat, lng, k))
        if len(via) < 2:
            continue
        ordered = sorted(via.values())
        plakard = f"{a.upper()} - {b.upper()}"
        slug = re.sub(r"[^a-z0-9]+", "-", plakard.lower().replace("ñ", "n")).strip("-")
        rid = slug if slug not in seen else f"{slug}-{t.get('ref', rel['id'])}".lower()
        seen.add(rid)
        net = t.get("network", "")
        ref = t.get("ref")
        if kind == "rail" and ref:
            ref = f"{'MRT' if 'MRT' in net or 'MRT' in t.get('name', '') else 'LRT'}-{ref}"
        out.append({
            "id": rid,
            "plakard": plakard,
            "aliases": [f"{b.upper()} - {a.upper()}"] + ([ref, f"{ref} LINE"] if kind == "rail" and ref else []),
            "kind": kind,
            "loop": "loop" in t.get("name", "").lower() or None,
            "ref": ref if kind in ("bus", "p2p", "rail") else None,
            "fixed": any(n in net or n in t.get("name", "") for n in OWN_FARE) or None,
            "operator": (t.get("operator") or "").split(";")[0] or None,
            "roads": [],
            "every": every(t.get("interval")),
            "via": [(*p, round(along[i] / 1000, 2)) for i, p in ordered],
            "path": segs,
            "osm": rel["id"],
        })
    disambiguate(out)
    out.sort(key=lambda r: ("rail p2p bus modern jeep uv".split().index(r["kind"]), r["plakard"]))
    print(f"{len(out)} routes:", {k: sum(r["kind"] == k for r in out) for k in ("rail", "jeep", "modern", "bus", "uv", "p2p")})
    running = {v[0] for r in out if r["kind"] == "rail" for v in r["via"]}
    spots = [h for h in load_local() if h["t"] != "train" or h["name"] in running]  # only stations of lines that run
    write_region("manila", out, spots, FETCHED)


if __name__ == "__main__":
    main()
